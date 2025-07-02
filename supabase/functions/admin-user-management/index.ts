
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
  console.log('🚀 Admin user management function called');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
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

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Verifying token...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Token verification failed:', authError.message);
      return new Response(
        JSON.stringify({ error: `Authentication failed: ${authError.message}` }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user) {
      console.error('❌ No user found for token');
      return new Response(
        JSON.stringify({ error: 'Invalid token - no user found' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Check admin role
    console.log('🔍 Checking admin role for user:', user.id);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      return new Response(
        JSON.stringify({ error: `Profile fetch failed: ${profileError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ Not an admin user. Profile:', profile);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Admin role verified');

    // Parse request body
    let requestData;
    try {
      const body = await req.text();
      console.log('📝 Raw request body:', body);
      
      if (!body.trim()) {
        throw new Error('Empty request body');
      }
      
      requestData = JSON.parse(body);
      console.log('📦 Parsed request data:', { 
        email: requestData.email, 
        fullName: requestData.fullName,
        hasPassword: !!requestData.password 
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return new Response(
        JSON.stringify({ error: `Invalid request body: ${parseError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    const { email, password, fullName } = requestData;
    
    if (!email || !password) {
      console.error('❌ Missing required fields:', { email: !!email, password: !!password });
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
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

    // Validate password length
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

    console.log('🔄 Creating user with email:', email);

    // Create user using admin client - DISABLE EMAIL CONFIRMATION
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // This bypasses email verification
      user_metadata: {
        full_name: fullName || '',
        display_name: fullName || ''
      }
    });

    if (createError) {
      console.error('❌ User creation failed:', createError);
      console.error('❌ Full error details:', JSON.stringify(createError, null, 2));
      
      // Provide more specific error messages
      let errorMessage = createError.message;
      if (createError.message.includes('already_registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (createError.message.includes('email')) {
        errorMessage = 'Email service configuration issue. Please check Supabase email settings.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user: ${errorMessage}`,
          details: createError.message
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
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User created successfully:', userData.user.email);
    console.log('✅ User ID:', userData.user.id);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        user: {
          id: userData.user.id,
          email: userData.user.email,
          created_at: userData.user.created_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
