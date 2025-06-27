import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import type { Profile } from "@/types/auth";

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
      return existingProfile;
    }

    // If no profile exists and no other error, create one
    if (!error || error.code === 'PGRST116') {
      console.log('➕ Creating new profile for user:', user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: user.email || '',
          role: 'user'
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return null;
      }

      console.log('✅ Created new profile:', newProfile);
      return newProfile || null;
    }

    console.error('❌ Error loading profile:', error);
    return null;
  } catch (error) {
    console.error('❌ Unexpected error in loadOrCreateProfile:', error);
    return null;
  }
};

// Validation functions for secure input handling
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
  }
  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
};
