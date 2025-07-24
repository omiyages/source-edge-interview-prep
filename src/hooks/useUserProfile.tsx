
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/auth';
import { loadOrCreateProfile } from '@/utils/secureProfileService';

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
        
        const profileData = await loadOrCreateProfile(user);
        
        if (!mounted) return;

        setProfile(profileData);
        
        // Update last login time when profile is loaded
        if (profileData) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating last login:', updateError);
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

  // Track session time
  useEffect(() => {
    if (!user?.id || !profile) return;

    const sessionStart = Date.now();
    
    const updateSessionTime = async () => {
      const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000 / 60); // minutes
      
      if (sessionDuration > 0) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            total_session_time_minutes: (profile.total_session_time_minutes || 0) + sessionDuration 
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating session time:', error);
        }
      }
    };

    // Update session time every 5 minutes
    const interval = setInterval(updateSessionTime, 5 * 60 * 1000);
    
    // Update on page unload
    const handleBeforeUnload = () => {
      updateSessionTime();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateSessionTime(); // Final update when component unmounts
    };
  }, [user?.id, profile?.total_session_time_minutes]);

  return { profile, loading };
};
