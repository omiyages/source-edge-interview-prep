
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method, body } = await req.json()
    
    // Verify the user making the request is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is admin - handle potential database issues
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile check error:', profileError)
        throw new Error('Failed to verify admin permissions')
      }

      if (profile?.role !== 'admin') {
        throw new Error('Insufficient permissions')
      }
    } catch (error) {
      console.error('Admin verification failed:', error)
      throw new Error('Failed to verify admin permissions')
    }

    let result

    switch (method) {
      case 'CREATE_USER':
        try {
          const { email, password, fullName } = body
          
          console.log('Creating user with email:', email)
          
          // Create user with admin API - set display name properly
          const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              display_name: fullName // This sets the display name in Supabase Auth
            }
          })

          if (createError) {
            console.error('Auth user creation error:', createError)
            throw new Error(`Failed to create user: ${createError.message}`)
          }

          console.log('Auth user created successfully:', userData.user?.id)

          // Wait a moment for the trigger to potentially create the profile
          await new Promise(resolve => setTimeout(resolve, 200))

          if (userData.user) {
            try {
              // Check if profile was created by trigger
              const { data: existingProfile, error: checkError } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, role')
                .eq('id', userData.user.id)
                .maybeSingle()

              if (checkError) {
                console.error('Profile check error:', checkError)
                // Continue to manual creation
              }

              if (!existingProfile) {
                console.log('Profile not found, creating manually')
                
                // Create profile manually with proper enum casting
                const { data: insertData, error: insertError } = await supabaseAdmin
                  .from('profiles')
                  .insert({
                    id: userData.user.id,
                    email: userData.user.email,
                    full_name: fullName,
                    role: 'user', // This will be cast to app_role enum by default
                    created_by: user.id
                  })
                  .select()

                if (insertError) {
                  console.error('Manual profile creation error:', insertError)
                  // Don't throw here, user was created successfully in auth
                  console.log('User created in auth but profile creation failed - user can still sign in')
                }
              } else if (!existingProfile.full_name && fullName) {
                // Update profile with full name if it wasn't set
                const { error: updateError } = await supabaseAdmin
                  .from('profiles')
                  .update({
                    full_name: fullName,
                    created_by: user.id
                  })
                  .eq('id', userData.user.id)

                if (updateError) {
                  console.error('Profile update error:', updateError)
                  // Don't throw here, user was created successfully
                }
              }
            } catch (profileError) {
              console.error('Profile handling error:', profileError)
              // Don't throw here, user was created successfully in auth
              console.log('User created in auth but profile handling failed')
            }
          }

          result = { success: true, user: userData.user }
        } catch (error) {
          console.error('CREATE_USER error:', error)
          throw error
        }
        break

      case 'DELETE_USER':
        const { userId } = body
        
        // Delete user with admin API
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        
        if (deleteError) throw deleteError

        result = { success: true }
        break

      default:
        throw new Error('Invalid method')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin user management error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
