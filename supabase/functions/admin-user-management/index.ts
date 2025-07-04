
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

Deno.serve(async (req) => {
  console.log('🚀 Admin user management function called - Method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('🔧 CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify request method
    if (req.method !== 'POST') {
      console.error('❌ Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Get and verify authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Extract and verify user token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Token extracted, length:', token.length);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Auth verification failed:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed: ' + authError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!user) {
      console.error('❌ No user found');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // 4. Check admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Profile verification failed' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ Not admin. Role:', profile?.role);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Admin role verified');

    // 5. Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('📄 Request body received, length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('❌ Empty request body');
        return new Response(
          JSON.stringify({ error: 'Request body is empty' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      requestData = JSON.parse(bodyText);
      console.log('📋 Parsed data:', requestData);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body: ' + parseError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, password, fullName, role = 'user' } = requestData;
    
    console.log('📝 Creating user with:', { 
      email: email?.toLowerCase().trim(), 
      fullName: fullName?.trim(), 
      role,
      passwordProvided: !!password
    });

    // 6. Validate required fields
    if (!email || !password) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (password.length < 6) {
      console.error('❌ Password too short');
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 7. Create the user with simpler approach
    console.log('👤 Attempting to create user...');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true
    });

    if (createError) {
      console.error('❌ User creation failed:', createError);
      
      let errorMessage = 'Failed to create user';
      if (createError.message.includes('already_registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (createError.message.includes('signup_disabled')) {
        errorMessage = 'User registration is currently disabled';
      } else {
        errorMessage = createError.message;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!newUser?.user) {
      console.error('❌ No user data returned from creation');
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User created successfully:', newUser.user.email);

    // 8. Create/update profile record
    console.log('👤 Creating profile record...');
    
    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: fullName?.trim() || '',
        role: role as 'user' | 'admin',
        created_by: user.id,
        is_active: true
      });

    if (profileCreateError) {
      console.warn('⚠️ Profile creation error (user still created):', profileCreateError);
      // Don't fail the entire operation if profile creation fails
    } else {
      console.log('✅ Profile created successfully');
    }

    // 9. Return success response
    const successResponse = {
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: fullName || '',
        role: role,
        created_at: newUser.user.created_at,
        email_confirmed: true
      }
    };

    console.log('🎉 Returning success response');

    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in function:', error);
    console.error('💥 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
