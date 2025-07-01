
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
      throw new Error('Insufficient permissions - admin role required')
    }

    let result

    switch (method) {
      case 'CREATE_USER':
        const { email, password, fullName } = body
        
        if (!email || !password) {
          throw new Error('Email and password are required')
        }

        console.log('Creating user with email:', email)
        
        // Create user with admin API
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
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

        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Update profile with additional info if needed
        if (fullName) {
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
