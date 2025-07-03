
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

Deno.serve(async (req) => {
  console.log('🚀 Admin user management function called');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Step 1: Get and log authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    console.log('🔑 Auth header preview:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Extract and verify token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extracted, length:', token.length);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Auth verification failed:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed: ' + authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      console.error('❌ No user found from token');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Step 3: Check admin role
    console.log('🔍 Checking admin role for user:', user.id);
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile query result:', { profile, profileError });

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user role: ' + profileError.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ User is not admin. Role:', profile?.role);
      return new Response(
        JSON.stringify({ error: 'Admin access required. Current role: ' + (profile?.role || 'none') }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin role verified');

    // Step 4: Parse request body
    console.log('📥 Parsing request body...');
    
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('📥 Raw body received, length:', bodyText.length);
      console.log('📥 Raw body preview:', bodyText.substring(0, 100));
      
      requestData = JSON.parse(bodyText);
      console.log('📥 Parsed request data keys:', Object.keys(requestData));
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Validate required fields
    const { email, password, fullName, role = 'user' } = requestData;
    
    console.log('🔍 Validating fields...');
    console.log('📝 Email:', email);
    console.log('📝 Full name:', fullName);
    console.log('📝 Role:', role);
    console.log('📝 Password length:', password?.length || 0);

    if (!email || !password) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      console.error('❌ Password too short');
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 6: Create the user
    console.log('👤 Creating user with admin privileges...');
    
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: fullName?.trim() || '',
        role: role
      }
    };

    console.log('👤 User creation payload:', {
      email: userData.email,
      email_confirm: userData.email_confirm,
      user_metadata: userData.user_metadata
    });

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(userData);

    if (createError) {
      console.error('❌ User creation failed:', createError);
      console.error('❌ Error details:', JSON.stringify(createError, null, 2));
      
      let errorMessage = 'Failed to create user';
      if (createError.message.includes('already_registered') || createError.message.includes('already been registered')) {
        errorMessage = 'A user with this email already exists';
      } else {
        errorMessage = `User creation failed: ${createError.message}`;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser?.user) {
      console.error('❌ No user data returned from creation');
      return new Response(
        JSON.stringify({ error: 'User creation succeeded but no user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User created successfully:', newUser.user.email);
    console.log('👤 New user ID:', newUser.user.id);

    // Step 7: Create/update profile record
    console.log('📝 Creating profile record...');
    
    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: fullName?.trim() || '',
        role: role,
        created_by: user.id,
        is_active: true
      });

    if (profileCreateError) {
      console.warn('⚠️ Profile creation warning:', profileCreateError.message);
      // Don't fail the entire operation if profile creation fails
    } else {
      console.log('✅ Profile created successfully');
    }

    // Step 8: Return success response
    const response = {
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

    console.log('🎉 Returning success response:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Unexpected error in function:');
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error.name || 'UnknownError'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
