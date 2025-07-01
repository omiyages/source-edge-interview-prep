
import { supabase } from "@/integrations/supabase/client";
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

    // If no profile exists, create one - let database handle the default role
    if (error?.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: user.email || '',
          last_login_at: new Date().toISOString()
          // Don't specify role - let database default handle it
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
