
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
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        setLoading(true);
        console.log('📋 Loading profile for user:', user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error('❌ Error loading profile:', error);
          setProfile(null);
          return;
        }

        if (data) {
          console.log('✅ Profile loaded:', data.role);
          setProfile(data);
        } else {
          // Create profile if it doesn't exist
          console.log('➕ Creating new profile');
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
            console.error('❌ Error creating profile:', createError);
            setProfile(null);
          } else {
            console.log('✅ Created new profile:', newProfile?.role);
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error loading profile:', error);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { profile, loading };
};
