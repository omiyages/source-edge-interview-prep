
// ABOUTME: Consolidated profile service with enhanced security and performance
// ABOUTME: Replaces multiple scattered profile services with a single, secure implementation

import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/auth";
import { logAuthFailure, logSuspiciousActivity } from "@/utils/securityLogger";
import { validateEmail, sanitizeInput } from "@/utils/inputSecurity";

export const loadOrCreateProfile = async (user: { id: string; email: string }): Promise<Profile | null> => {
  try {
    // Validate email before processing
    if (!validateEmail(user.email || '')) {
      logSuspiciousActivity(`Invalid email format in profile loading: ${user.email}`, user.id);
      return null;
    }
    
    // Use optimized query with specific field selection
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, last_login_at, total_session_time_minutes, is_active, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile;
    }

    // If no profile exists, create one with secure defaults
    if (!error || error.code === 'PGRST116') {
      const sanitizedEmail = sanitizeInput(user.email || '');
      
      // All new profiles start as 'user' role for security
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: sanitizedEmail,
          role: 'user', // Always start with user role for security
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id, email, role, full_name, last_login_at, total_session_time_minutes, is_active, created_at, updated_at')
        .single();

      if (createError) {
        logAuthFailure(`Failed to create profile: ${createError.message}`, user.id);
        return null;
      }
      
      return newProfile || null;
    }

    logAuthFailure(`Failed to load profile: ${error.message}`, user.id);
    return null;
  } catch (error) {
    logAuthFailure(`Unexpected error in profile loading: ${error}`, user.id);
    return null;
  }
};

export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      // Silently handle - non-critical
    }
  } catch (error) {
    // Silently handle - non-critical
  }
};

export const updateSessionTime = async (userId: string, additionalMinutes: number): Promise<void> => {
  try {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('total_session_time_minutes')
      .eq('id', userId)
      .single();

    if (currentProfile) {
      const currentTime = currentProfile.total_session_time_minutes || 0;
      const newTime = currentTime + additionalMinutes;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          total_session_time_minutes: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // error handled silently - non-critical
    }
  } catch (error) {
    // Silently handle - non-critical
  }
};
