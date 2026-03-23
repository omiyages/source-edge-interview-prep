
// ABOUTME: Consolidated profile service with enhanced security and performance
// ABOUTME: Replaces multiple scattered profile services with a single, secure implementation

import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Profile } from "@/types/auth";
import { logAuthFailure, logSuspiciousActivity } from "@/utils/securityLogger";
import { validateEmail, sanitizeInput } from "@/utils/inputSecurity";

// Requires a Clerk-authenticated Supabase client (from useClerkSupabase).
// Using the unauthenticated client will fail RLS policies on the profiles table.
export const loadOrCreateProfile = async (
  user: { id: string; email: string },
  client: SupabaseClient<Database>
): Promise<Profile | null> => {
  const db = client;

  try {
    // Skip email validation if email is empty (some OAuth flows may omit it)
    if (user.email && !validateEmail(user.email)) {
      logSuspiciousActivity(`Invalid email format in profile loading: ${user.email}`, user.id);
      console.warn('[ProfileService] Invalid email format, skipping profile load for user:', user.id);
      return null;
    }

    // Use optimized query with specific field selection
    const { data: existingProfile, error } = await db
      .from('profiles')
      .select('id, email, role, full_name, last_login_at, total_session_time_minutes, is_active, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[ProfileService] SELECT error — RLS or JWT issue:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details,
        userId: user.id,
      });
    }

    if (existingProfile) {
      console.log('[ProfileService] Profile loaded for user:', user.id);
      return existingProfile;
    }

    // If no profile exists, create one with secure defaults
    if (!error || error.code === 'PGRST116') {
      const sanitizedEmail = sanitizeInput(user.email || '');
      console.log('[ProfileService] No profile found, creating new profile for user:', user.id);

      // All new profiles start as 'user' role for security
      const { data: newProfile, error: createError } = await db
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
        console.error('[ProfileService] INSERT error — RLS or constraint issue:', {
          code: createError.code,
          message: createError.message,
          hint: createError.hint,
          details: createError.details,
          userId: user.id,
        });
        logAuthFailure(`Failed to create profile: ${createError.message}`, user.id);
        return null;
      }

      console.log('[ProfileService] Profile created for user:', user.id);
      return newProfile || null;
    }

    logAuthFailure(`Failed to load profile: ${error.message}`, user.id);
    return null;
  } catch (error) {
    console.error('[ProfileService] Unexpected error:', error);
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
