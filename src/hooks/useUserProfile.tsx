
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/auth';

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error('Error loading profile:', error);
          setProfile(null);
          return;
        }

        if (data) {
          setProfile(data);
        } else {
          // Create profile if it doesn't exist
          const isAdminEmail = user.email === 'namtae.quicksit@gmail.com';
          const defaultRole = isAdminEmail ? 'admin' : 'user';
          
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
            console.error('Error creating profile:', createError);
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('Unexpected error loading profile:', error);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id, user?.email]);

  return { profile, loading };
};
