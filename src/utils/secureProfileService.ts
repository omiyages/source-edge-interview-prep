
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import type { Profile } from "@/types/auth";
import { logAuthFailure, logAdminAction, logSuspiciousActivity } from "@/utils/securityLogger";
import { validateEmail, sanitizeInput } from "@/utils/inputSecurity";

export const loadOrCreateProfile = async (user: User): Promise<Profile | null> => {
  try {
    console.log('🔍 Loading profile for user:', user.id, user.email);
    
    // Validate email before processing
    if (!validateEmail(user.email || '')) {
      logSuspiciousActivity(`Invalid email format in profile loading: ${user.email}`, user.id);
      return null;
    }
    
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

    // If no profile exists, create one with default user role
    if (!error || error.code === 'PGRST116') {
      console.log('➕ Creating new profile for user:', user.id);
      
      const sanitizedEmail = sanitizeInput(user.email || '');
      
      // All new profiles start as 'user' role for security
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: sanitizedEmail,
          role: 'user' // Always start with user role
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
      
      // Log new profile creation
      logAdminAction(`New user profile created: ${user.email}`, user.id, {
        role: newProfile?.role,
        createdAt: new Date().toISOString()
      });
      
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
