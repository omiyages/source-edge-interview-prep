
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
        console.log('📋 useUserProfile: No user ID, clearing profile');
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📋 useUserProfile: Loading profile for user:', user.id, 'email:', user.email);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error('❌ useUserProfile: Error loading profile:', error);
          setProfile(null);
          return;
        }

        if (data) {
          console.log('✅ useUserProfile: Profile loaded successfully:', { 
            role: data.role, 
            email: data.email,
            userId: data.id,
            isAdmin: data.role === 'admin'
          });
          setProfile(data);
        } else {
          // Create profile if it doesn't exist
          console.log('➕ useUserProfile: Creating new profile for user:', user.email);
          const isAdminEmail = user.email === 'namtae.quicksit@gmail.com';
          const defaultRole = isAdminEmail ? 'admin' : 'user';
          
          console.log('🔧 useUserProfile: Creating profile with role:', defaultRole, 'for email:', user.email);
          
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
            console.error('❌ useUserProfile: Error creating profile:', createError);
            setProfile(null);
          } else {
            console.log('✅ useUserProfile: Created new profile:', { 
              role: newProfile?.role, 
              email: newProfile?.email,
              userId: newProfile?.id,
              isAdmin: newProfile?.role === 'admin'
            });
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('❌ useUserProfile: Unexpected error loading profile:', error);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('📋 useUserProfile: Loading complete for user:', user.email);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id, user?.email]);

  console.log('📋 useUserProfile: Current state:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    loading,
    isProfileAdmin: profile?.role === 'admin'
  });

  return { profile, loading };
};
