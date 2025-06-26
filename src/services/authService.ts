
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USERS, USERNAME_TO_EMAIL_MAP } from "@/constants/demoUsers";
import type { User } from '@supabase/supabase-js';
import type { Profile } from "@/types/auth";

export const loadOrCreateProfile = async (user: User): Promise<Profile | null> => {
  try {
    // First try to get existing profile
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // If no profile exists, create one
    if (error?.code === 'PGRST116') {
      // Determine role based on email
      const email = user.email || '';
      let role: 'user' | 'admin' = 'user';
      
      if (email === 'admin@sourceedge.dev') {
        role = 'admin';
      }

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: email,
          role: role 
        }])
        .select()
        .single();

      return newProfile || null;
    }

    return null;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};

export const mapCredentials = (emailOrUsername: string, password: string) => {
  let email = emailOrUsername;
  
  // Map usernames to emails for demo - ensure exact mapping
  if (emailOrUsername in USERNAME_TO_EMAIL_MAP) {
    email = USERNAME_TO_EMAIL_MAP[emailOrUsername as keyof typeof USERNAME_TO_EMAIL_MAP];
  }
  
  return { email, password };
};

export const isDemoUser = (email: string): boolean => {
  return email in DEMO_USERS;
};

export const getDemoUser = (email: string) => {
  return DEMO_USERS[email as keyof typeof DEMO_USERS];
};
