
// ABOUTME: Optimized user profile hook with in-memory state only
// ABOUTME: Uses the Clerk-authenticated Supabase client so RLS policies resolve correctly

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MinimalUser } from '@/hooks/useAuthContext';
import type { Profile } from '@/types/auth';
import { loadOrCreateProfile, updateLastLogin, updateSessionTime } from '@/services/profileService';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';

function getCachedProfile(_userId: string): Profile | null {
  // Avoid persisting profile details in browser storage.
  return null;
}

function setCachedProfile(_profile: Profile | null) {
  // Intentionally no-op to reduce client-side sensitive data persistence.
}

export const useOptimizedUserProfile = (user: MinimalUser | null) => {
  const { client: authClient, isReady: clientReady, hasClerkJwt } = useClerkSupabase();

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
        await updateLastLogin(user.id, authClient);
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
    if (!user?.id || !profile || !authClient || !hasClerkJwt) return;

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
  }, [user?.id, profile?.id, authClient, hasClerkJwt]);

  return {
    profile,
    loading,
    loadFailed,
    refetch: loadProfile,
    /** Clerk JWT is on the singleton client — required for admin RLS on roles, etc. */
    hasClerkJwt,
    clerkClientReady: clientReady,
  };
};
