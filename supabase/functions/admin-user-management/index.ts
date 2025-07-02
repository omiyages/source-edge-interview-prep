
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
  console.log('🚀 Admin user management function called', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Step 1: Verify authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header check:', { hasAuth: !!authHeader });
    
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 2: Verify user token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Verifying token...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Token verification failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User verified:', { userId: user.id, email: user.email });

    // Step 3: Check admin role
    console.log('🔍 Checking admin role...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile lookup failed:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (profile?.role !== 'admin') {
      console.error('❌ User is not admin:', { role: profile?.role, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Admin role required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Admin role verified');

    // Step 4: Parse request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('📝 Raw body:', bodyText);
      
      if (!bodyText) {
        throw new Error('Empty request body');
      }
      
      requestData = JSON.parse(bodyText);
      console.log('📦 Parsed data:', requestData);
    } catch (parseError) {
      console.error('❌ Body parsing failed:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 5: Extract and validate user data
    const { email, password, fullName } = requestData;
    console.log('📋 User data:', { email, hasPassword: !!password, fullName });

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

    // Step 6: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 7: Validate password length
    if (password.length < 6) {
      console.error('❌ Password too short');
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 8: Create user
    console.log('🔄 Creating user...');
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || '',
        display_name: fullName || ''
      }
    });

    if (createError) {
      console.error('❌ User creation failed:', createError);
      return new Response(
        JSON.stringify({ 
          error: `User creation failed: ${createError.message}`,
          details: createError
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!userData?.user) {
      console.error('❌ No user data returned');
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user returned' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User created successfully:', {
      id: userData.user.id,
      email: userData.user.email
    });

    // Step 9: Return success response
    const response = {
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        created_at: userData.user.created_at
      }
    };

    console.log('📤 Sending response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
