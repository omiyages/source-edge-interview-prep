
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

// Generate cryptographically secure password
const generateSecurePassword = (length: number = 16): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure password meets complexity requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return generateSecurePassword(length);
  }
  
  return password;
};

// Input validation and sanitization
const validateAndSanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input provided');
  }
  
  // Remove dangerous characters and limit length
  const sanitized = input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, maxLength);
    
  if (sanitized.length === 0) {
    throw new Error('Input cannot be empty after sanitization');
  }
  
  return sanitized;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

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

    // 5. Parse and validate request body
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
      console.log('📋 Parsed data keys:', Object.keys(requestData));
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

    // Handle different operation types
    const { method, body } = requestData;
    
    if (method === 'DELETE_USER') {
      return await handleDeleteUser(body.userId);
    }
    
    // Default to CREATE_USER for backward compatibility
    const { email, fullName, role = 'user' } = requestData;
    
    // 6. Validate and sanitize inputs
    if (!email) {
      console.error('❌ Missing email');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const sanitizedEmail = validateAndSanitizeInput(email.toLowerCase().trim(), 254);
    const sanitizedFullName = fullName ? validateAndSanitizeInput(fullName, 100) : '';
    const sanitizedRole = validateAndSanitizeInput(role, 10);

    if (!validateEmail(sanitizedEmail)) {
      console.error('❌ Invalid email format');
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📝 Creating user with:', { 
      email: sanitizedEmail, 
      fullName: sanitizedFullName, 
      role: sanitizedRole
    });

    // 7. Generate secure temporary password
    const temporaryPassword = generateSecurePassword(16);
    console.log('🔐 Generated secure temporary password');

    // 8. Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userExists = existingUsers?.users?.some(u => u.email === sanitizedEmail);
    
    if (userExists) {
      console.error('❌ User already exists');
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 9. Create user with secure password
    console.log('👤 Creating new user...');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedFullName
      }
    });

    if (createError) {
      console.error('❌ User creation failed:', createError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user: ' + createError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!newUser?.user) {
      console.error('❌ No user data returned');
      return new Response(
        JSON.stringify({ error: 'No user data returned from creation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User created successfully with ID:', newUser.user.id);

    // 10. Create profile record
    console.log('👤 Creating profile record...');
    
    try {
      const { error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: sanitizedFullName,
          role: sanitizedRole as 'user' | 'admin',
          created_by: user.id,
          is_active: true
        });

      if (profileCreateError) {
        console.error('❌ Profile creation error:', profileCreateError);
        throw new Error('Profile creation failed: ' + profileCreateError.message);
      }

      console.log('✅ Profile created successfully');
    } catch (profileError) {
      console.error('❌ Critical profile creation error:', profileError);
      
      // Clean up user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        console.log('🧹 Cleaned up user after profile creation failure');
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup user:', cleanupError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Database error creating user profile. Please try again.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 11. Return success response with temporary password
    const successResponse = {
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: sanitizedFullName,
        role: sanitizedRole,
        created_at: newUser.user.created_at,
        email_confirmed: true
      },
      temporaryPassword: temporaryPassword,
      note: 'Please share this temporary password securely with the user. They should change it on first login.'
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

// Handle user deletion
async function handleDeleteUser(userId: string) {
  try {
    console.log('🗑️ Deleting user:', userId);
    
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid user ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Delete user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('❌ User deletion failed:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User deleted successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Error in handleDeleteUser:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete user' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
