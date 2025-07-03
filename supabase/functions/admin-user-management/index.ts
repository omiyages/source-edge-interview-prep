
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
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Check admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('❌ Not admin or profile error:', profileError?.message, profile?.role);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin role verified');

    // Parse request body
    const requestData = await req.json();
    const { email, password, fullName, role = 'user' } = requestData;
    
    console.log('📝 Request data:', { email, fullName, role, passwordLength: password?.length });

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user
    console.log('👤 Creating user...');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName?.trim() || '',
        role: role
      }
    });

    if (createError) {
      console.error('❌ User creation error:', createError);
      
      let errorMessage = 'Failed to create user';
      if (createError.message.includes('already_registered')) {
        errorMessage = 'A user with this email already exists';
      } else {
        errorMessage = createError.message;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser?.user) {
      console.error('❌ No user data returned');
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User created:', newUser.user.email);

    // Create profile record
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
      console.warn('⚠️ Profile creation warning:', profileCreateError);
    } else {
      console.log('✅ Profile created');
    }

    // Return success
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

    console.log('🎉 Success response:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Server error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
