
// ABOUTME: Consolidated profile service with enhanced security and performance
// ABOUTME: Replaces multiple scattered profile services with a single, secure implementation

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
    
    // Use optimized query with specific field selection
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, last_login_at, total_session_time_minutes, is_active, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    console.log('📋 Profile query result:', { existingProfile, error });

    if (existingProfile) {
      console.log('✅ Found existing profile:', existingProfile);
      
      // Log successful profile load
      logAdminAction(`Profile loaded successfully for user: ${user.email}`, user.id, {
        role: existingProfile.role,
        lastLogin: existingProfile.last_login_at
      });
      
      return existingProfile;
    }

    // If no profile exists, create one with secure defaults
    if (!error || error.code === 'PGRST116') {
      console.log('➕ Creating new profile for user:', user.id);
      
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
        console.error('❌ Error creating profile:', createError);
        logAuthFailure(`Failed to create profile: ${createError.message}`, user.id);
        return null;
      }

      console.log('✅ Created new profile:', newProfile);
      
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
      console.error('Error updating last login:', error);
    }
  } catch (error) {
    console.error('Unexpected error updating last login:', error);
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
      const { error } = await supabase
        .from('profiles')
        .update({ 
          total_session_time_minutes: (currentProfile.total_session_time_minutes || 0) + additionalMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating session time:', error);
      }
    }
  } catch (error) {
    console.error('Unexpected error updating session time:', error);
  }
};
