
// ABOUTME: Optimized user profile hook with better performance and caching
// ABOUTME: Replaces the existing useUserProfile with improved efficiency

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/auth';
import { loadOrCreateProfile, updateLastLogin, updateSessionTime } from '@/services/profileService';

export const useOptimizedUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const profileData = await loadOrCreateProfile(user);
      setProfile(profileData);
      
      // Update last login time when profile is loaded
      if (profileData) {
        await updateLastLogin(user.id);
      }
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Optimized session tracking with debouncing
  useEffect(() => {
    if (!user?.id || !profile) return;

    const sessionStart = Date.now();
    let sessionUpdateTimeout: NodeJS.Timeout;
    
    const updateSessionTimeDebounced = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000 / 60); // minutes
      
      if (sessionDuration > 0) {
        updateSessionTime(user.id, sessionDuration);
      }
    };

    // Update session time every 5 minutes with debouncing
    const interval = setInterval(() => {
      clearTimeout(sessionUpdateTimeout);
      sessionUpdateTimeout = setTimeout(updateSessionTimeDebounced, 1000);
    }, 5 * 60 * 1000);
    
    // Update on page unload
    const handleBeforeUnload = () => {
      clearTimeout(sessionUpdateTimeout);
      updateSessionTimeDebounced();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      clearTimeout(sessionUpdateTimeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateSessionTimeDebounced(); // Final update when component unmounts
    };
  }, [user?.id, profile?.id]);

  return { profile, loading, refetch: loadProfile };
};
