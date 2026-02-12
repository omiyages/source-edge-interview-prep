
// ABOUTME: Optimized user profile hook with localStorage caching for instant loads
// ABOUTME: Replaces the existing useUserProfile with improved efficiency

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/auth';
import { loadOrCreateProfile, updateLastLogin, updateSessionTime } from '@/services/profileService';

const PROFILE_CACHE_KEY = 'se-cached-profile';

function getCachedProfile(userId: string): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // Only use cache if it matches the current user
    if (cached && cached.id === userId) return cached as Profile;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setCachedProfile(profile: Profile | null) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {
    // Ignore quota errors
  }
}

export const useOptimizedUserProfile = (user: User | null) => {
  // Try to hydrate instantly from localStorage to avoid loading flash
  const cachedProfile = user?.id ? getCachedProfile(user.id) : null;
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  // If we already have a cached profile, skip the loading state entirely
  const [loading, setLoading] = useState(false);
  const hasHydrated = useRef(!!cachedProfile);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setCachedProfile(null);
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner if we don't have a cached profile to show
      if (!hasHydrated.current) {
        setLoading(true);
      }
      
      const profileData = await loadOrCreateProfile(user);
      setProfile(profileData);
      setCachedProfile(profileData);
      hasHydrated.current = !!profileData;
      
      // Update last login time when profile is loaded
      if (profileData) {
        await updateLastLogin(user.id);
      }
    } catch (error) {
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
    let lastUpdateTime = sessionStart;
    let sessionUpdateTimeout: NodeJS.Timeout;
    
    const updateSessionTimeDebounced = () => {
      const now = Date.now();
      const incrementalMinutes = Math.floor((now - lastUpdateTime) / 1000 / 60); // minutes since last update
      
      if (incrementalMinutes > 0) {
        updateSessionTime(user.id, incrementalMinutes);
        lastUpdateTime = now; // Update the last update time
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
