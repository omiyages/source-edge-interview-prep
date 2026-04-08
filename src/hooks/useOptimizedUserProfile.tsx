
// ABOUTME: Optimized user profile hook with localStorage caching for instant loads
// ABOUTME: Uses the Clerk-authenticated Supabase client so RLS policies resolve correctly

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MinimalUser } from '@/hooks/useAuthContext';
import type { Profile } from '@/types/auth';
import { loadOrCreateProfile, updateLastLogin, updateSessionTime } from '@/services/profileService';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';

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

export const useOptimizedUserProfile = (user: MinimalUser | null) => {
  const { client: authClient, isReady: clientReady } = useClerkSupabase();

  // Try to hydrate instantly from localStorage to avoid loading flash
  const cachedProfile = user?.id ? getCachedProfile(user.id) : null;
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  // Show loading while we wait for the authenticated client + profile fetch
  const [loading, setLoading] = useState(!!user?.id && !cachedProfile);
  const [loadFailed, setLoadFailed] = useState(false);
  const hasHydrated = useRef(!!cachedProfile);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setCachedProfile(null);
      setLoading(false);
      setLoadFailed(false);
      return;
    }

    try {
      // Only show loading spinner if we don't have a cached profile to show
      if (!hasHydrated.current) {
        setLoading(true);
      }
      setLoadFailed(false);

      const profileData = await loadOrCreateProfile(user, authClient);
      setProfile(profileData);
      setCachedProfile(profileData);
      hasHydrated.current = !!profileData;

      if (!profileData) {
        setLoadFailed(true);
      }

      // Update last login time when profile is loaded
      if (profileData) {
        await updateLastLogin(user.id);
      }
    } catch (error) {
      setProfile(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, authClient]);

  // Wait until the Clerk-authenticated client is ready before loading the profile.
  // This ensures RLS policies (which use auth.uid() from the Clerk JWT) resolve correctly.
  useEffect(() => {
    if (clientReady) {
      loadProfile();
    }
  }, [loadProfile, clientReady]);

  // Optimized session tracking with debouncing
  useEffect(() => {
    if (!user?.id || !profile || !authClient) return;

    const sessionStart = Date.now();
    let lastUpdateTime = sessionStart;
    let sessionUpdateTimeout: NodeJS.Timeout;

    const updateSessionTimeDebounced = () => {
      const now = Date.now();
      const incrementalMinutes = Math.floor((now - lastUpdateTime) / 1000 / 60); // minutes since last update

      if (incrementalMinutes > 0) {
        updateSessionTime(user.id, incrementalMinutes, authClient);
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
  }, [user?.id, profile?.id, authClient]);

  return { profile, loading, loadFailed, refetch: loadProfile };
};
