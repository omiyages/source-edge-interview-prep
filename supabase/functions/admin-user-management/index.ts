
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    let result

    switch (method) {
      case 'CREATE_USER':
        try {
          const { email, password, fullName } = body
          
          console.log('Creating user with email:', email)
          
          // Create user with admin API
          const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName
            }
          })

          if (createError) {
            console.error('Auth user creation error:', createError)
            throw new Error(`Failed to create user: ${createError.message}`)
          }

          console.log('User created successfully:', userData.user?.id)

          // The handle_new_user trigger should create the profile automatically
          // Let's wait a moment and then check if we need to update it
          await new Promise(resolve => setTimeout(resolve, 100))

          if (userData.user) {
            // Check if profile was created by trigger
            const { data: existingProfile, error: checkError } = await supabaseAdmin
              .from('profiles')
              .select('id, full_name')
              .eq('id', userData.user.id)
              .single()

            if (checkError) {
              console.log('Profile not found, creating manually:', checkError.message)
              
              // Create profile manually if trigger failed
              const { error: insertError } = await supabaseAdmin
                .from('profiles')
                .insert({
                  id: userData.user.id,
                  email: userData.user.email,
                  full_name: fullName,
                  created_by: user.id,
                  role: 'user'
                })

              if (insertError) {
                console.error('Manual profile creation error:', insertError)
                throw new Error(`Failed to create user profile: ${insertError.message}`)
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
