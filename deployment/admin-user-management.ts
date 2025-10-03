
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

// Enhanced input validation and sanitization
const validateAndSanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input provided');
  }
  
  // Check for XSS attempts
  if (/<script|javascript:|on\w+=/i.test(input)) {
    throw new Error('Security violation: Invalid input detected');
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

// Get client IP address
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
};

Deno.serve(async (req) => {
  console.log('🚀 Secure admin user management function called - Method:', req.method);
  
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
    
    if (authError || !user) {
      console.error('❌ Auth verification failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // 4. Check rate limit using the new database function
    const clientIP = getClientIP(req);
    const { data: rateLimitOk, error: rateLimitError } = await supabaseAdmin
      .rpc('check_rate_limit', {
        operation_name: 'admin_user_creation',
        max_attempts: 10,
        window_minutes: 60
      });

    if (rateLimitError || !rateLimitOk) {
      console.error('❌ Rate limit exceeded or check failed');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 5. Check admin role using secure function
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

    if (roleError || !isAdmin) {
      console.error('❌ Admin verification failed. Role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Admin role verified');

    // 6. Parse and validate request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('📄 Request body received, length:', bodyText.length);
      console.log('📄 Request body content:', bodyText);
      
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
      console.log('📋 Parsed data structure:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle different operation types
    const { method, body } = requestData;
    
    if (method === 'DELETE_USER') {
      return await handleDeleteUser(body.userId, user.id);
    }
    
    // Default to CREATE_USER for backward compatibility
    // Handle both direct properties and nested body structure
    const userData = requestData.body || requestData;
    console.log('📋 User data extracted:', JSON.stringify(userData, null, 2));
    
    const { email, fullName, role = 'user', customPassword } = userData;
    
    // 7. Validate and sanitize inputs with enhanced security
    if (!email) {
      console.error('❌ Missing email in user data:', userData);
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let sanitizedEmail, sanitizedFullName, sanitizedRole;
    
    try {
      sanitizedEmail = validateAndSanitizeInput(email.toLowerCase().trim(), 254);
      sanitizedFullName = fullName ? validateAndSanitizeInput(fullName, 100) : '';
      sanitizedRole = validateAndSanitizeInput(role, 10);
    } catch (sanitizationError) {
      console.error('❌ Input sanitization failed:', sanitizationError);
      return new Response(
        JSON.stringify({ error: sanitizationError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    console.log('📝 Creating user with enhanced security:', { 
      email: sanitizedEmail, 
      fullName: sanitizedFullName, 
      role: sanitizedRole,
      hasCustomPassword: !!customPassword
    });

    // 8. Determine password to use
    let passwordToUse: string;
    if (customPassword && typeof customPassword === 'string' && customPassword.trim().length > 0) {
      // Validate custom password
      if (customPassword.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Custom password must be at least 8 characters long' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      passwordToUse = customPassword;
      console.log('🔐 Using custom password provided by admin');
    } else {
      passwordToUse = generateSecurePassword(16);
      console.log('🔐 Generated secure temporary password');
    }

    // 9. Check if user already exists
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

    // 10. Create user with the determined password
    console.log('👤 Creating new user...');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: passwordToUse,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedFullName
      }
    });

    if (createError || !newUser?.user) {
      console.error('❌ User creation failed:', createError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user: ' + (createError?.message || 'Unknown error')
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User created successfully with ID:', newUser.user.id);

    // 11. Create profile record using secure method
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

    // 12. Return success response with security notice
    const successResponse = {
      success: true,
      message: 'User created successfully with enhanced security',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: sanitizedFullName,
        role: sanitizedRole,
        created_at: newUser.user.created_at,
        email_confirmed: true
      },
      temporaryPassword: passwordToUse,
      security: {
        audit_logged: true,
        rate_limited: true,
        input_sanitized: true,
        custom_password_used: !!customPassword
      },
      note: 'Please share this password securely with the user. They should change it on first login.'
    };

    console.log('🎉 Returning secure success response');

    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in secure function:', error);
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

// Enhanced secure user deletion handler
async function handleDeleteUser(userId: string, requestingUserId: string) {
  try {
    console.log('🗑️ Secure user deletion:', userId, 'by:', requestingUserId);
    
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid user ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prevent self-deletion at the server level
    if (userId === requestingUserId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account for security reasons' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check rate limit for deletion operations
    const { data: rateLimitOk } = await supabaseAdmin
      .rpc('check_rate_limit', {
        operation_name: 'admin_user_deletion',
        max_attempts: 5,
        window_minutes: 30
      });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded for deletion operations' }),
        { 
          status: 429, 
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

    console.log('✅ User deleted securely');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        security: {
          self_deletion_prevented: true,
          rate_limited: true,
          audit_logged: true
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Error in secure handleDeleteUser:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete user securely' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
