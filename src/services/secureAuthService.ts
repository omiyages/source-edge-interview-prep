
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import type { Profile } from "@/types/auth";
import { logAuthFailure, logAdminAction, logSuspiciousActivity } from "@/utils/securityLogger";

export const loadOrCreateProfile = async (user: User): Promise<Profile | null> => {
  try {
    console.log('🔍 Loading profile for user:', user.id, user.email);
    
    // First try to get existing profile
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('📋 Profile query result:', { existingProfile, error });

    if (existingProfile) {
      console.log('✅ Found existing profile:', existingProfile);
      console.log('🔑 Profile role:', existingProfile.role);
      
      // Log successful profile load
      logAdminAction(`Profile loaded successfully for user: ${user.email}`, user.id, {
        role: existingProfile.role,
        lastLogin: existingProfile.last_login_at
      });
      
      return existingProfile;
    }

    // If no profile exists, create one
    if (!error || error.code === 'PGRST116') {
      console.log('➕ Creating new profile for user:', user.id);
      
      // Check if this email should be admin
      const isAdminEmail = user.email === 'namtae.quicksit@gmail.com';
      const defaultRole = isAdminEmail ? 'admin' : 'user';
      
      console.log('🎭 Setting role for new profile:', defaultRole, 'for email:', user.email);
      
      // Log admin account creation
      if (isAdminEmail) {
        logAdminAction(`New admin profile created for: ${user.email}`, user.id, {
          role: defaultRole,
          createdAt: new Date().toISOString()
        });
      }
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: user.email || '',
          role: defaultRole
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
        logAuthFailure(`Failed to create profile: ${createError.message}`, user.id);
        return null;
      }

      console.log('✅ Created new profile:', newProfile);
      console.log('🔑 New profile role:', newProfile?.role);
      return newProfile || null;
    }

    console.error('❌ Error loading profile:', error);
    logAuthFailure(`Failed to load profile: ${error.message}`, user.id);
    return null;
  } catch (error) {
    console.error('❌ Unexpected error in loadOrCreateProfile:', error);
    logAuthFailure(`Unexpected error in profile loading: ${error}`, user.id);
    return null;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email) && email.length <= 254;
  
  if (!isValid) {
    logSuspiciousActivity(`Invalid email format attempted: ${email.substring(0, 20)}...`, undefined, {
      email: email.substring(0, 50),
      length: email.length
    });
  }
  
  return isValid;
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    logSuspiciousActivity('Weak password pattern detected', undefined, {
      passwordLength: password.length
    });
    return { isValid: false, message: "Password contains common weak patterns" };
  }
  
  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000);
};

// Track authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const trackAuthAttempt = (email: string, success: boolean): boolean => {
  const now = Date.now();
  const key = email.toLowerCase();
  const attempt = authAttempts.get(key) || { count: 0, lastAttempt: 0 };
  
  // Reset counter if more than 15 minutes have passed
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    attempt.count = 0;
  }
  
  if (success) {
    // Reset on successful login
    authAttempts.delete(key);
    return true;
  } else {
    // Increment failed attempts
    attempt.count++;
    attempt.lastAttempt = now;
    authAttempts.set(key, attempt);
    
    // Log suspicious activity after 3 failed attempts
    if (attempt.count >= 3) {
      logSuspiciousActivity(`Multiple failed login attempts for email: ${email}`, undefined, {
        email,
        attemptCount: attempt.count,
        timeWindow: '15 minutes'
      });
    }
    
    // Block after 5 failed attempts
    return attempt.count < 5;
  }
};
