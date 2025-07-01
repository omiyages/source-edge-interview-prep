
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
        const { email, password, fullName } = body
        
        // Create user with admin API
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })

        if (createError) throw createError

        // Update profile with full name
        if (userData.user) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: fullName,
              created_by: user.id,
            })
            .eq('id', userData.user.id)

          if (profileError) throw profileError
        }

        result = { success: true, user: userData.user }
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
