
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
    
    console.log('Admin user management request:', { method, body })
    
    // Verify the user making the request is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid authentication')
    }

    // Check if user is admin
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
      console.error('User is not admin:', profile?.role)
      throw new Error('Insufficient permissions - admin role required')
    }

    let result

    switch (method) {
      case 'CREATE_USER':
        const { email, password, fullName } = body
        
        // Validate input
        if (!email || !password) {
          throw new Error('Email and password are required')
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format')
        }

        console.log('Creating user with email:', email)
        
        // Create user with admin API
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || '',
            display_name: fullName || ''
          }
        })

        if (createError) {
          console.error('User creation error:', createError)
          throw new Error(`Failed to create user: ${createError.message}`)
        }

        if (!userData.user) {
          throw new Error('User creation failed - no user data returned')
        }

        console.log('User created successfully:', userData.user.id)

        // The trigger should automatically create the profile, but let's verify
        let retries = 0
        let profileCreated = false
        
        while (retries < 5 && !profileCreated) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: newProfile, error: profileCheckError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .maybeSingle()

          if (newProfile) {
            profileCreated = true
            console.log('Profile created successfully:', newProfile)
            
            // Update profile with additional info if needed
            if (fullName && fullName !== newProfile.full_name) {
              const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ 
                  full_name: fullName,
                  created_by: user.id 
                })
                .eq('id', userData.user.id)

              if (updateError) {
                console.error('Profile update error:', updateError)
                // Don't throw here - user was created successfully
              }
            }
          } else {
            console.log(`Profile not found, retry ${retries + 1}/5`)
            retries++
          }
        }

        if (!profileCreated) {
          console.error('Profile was not created after 5 retries')
          // Don't throw here - user was created successfully, profile issue is secondary
        }

        result = { 
          success: true, 
          user: {
            id: userData.user.id,
            email: userData.user.email,
            created_at: userData.user.created_at
          }
        }
        break

      case 'DELETE_USER':
        const { userId } = body
        
        if (!userId) {
          throw new Error('User ID is required')
        }
        
        // Delete user with admin API
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        
        if (deleteError) {
          console.error('User deletion error:', deleteError)
          throw new Error(`Failed to delete user: ${deleteError.message}`)
        }

        console.log('User deleted successfully:', userId)
        result = { success: true }
        break

      default:
        throw new Error(`Invalid method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin user management error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
