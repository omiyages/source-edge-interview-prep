/**
 * Hook: useClerkSupabase
 *
 * Returns a Supabase client authenticated with the current Clerk user's
 * JWT.  The token is fetched from Clerk's `useAuth().getToken()` and
 * injected into the Supabase client's Authorization header so that
 * RLS policies using `auth.uid()` resolve correctly.
 *
 * Usage:
 *   const { client, isReady } = useClerkSupabase();
 *   // Wait for isReady before making queries that depend on RLS
 *   const { data } = await client.from('profiles').select('*');
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { createClerkSupabaseClient } from '@/lib/clerk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export function useClerkSupabase() {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const clientRef = useRef<SupabaseClient<Database> | null>(null);

  // Build or refresh the Supabase client with the latest Clerk JWT.
  const refreshClient = useCallback(async () => {
    if (!isSignedIn) {
      // Unauthenticated — use a client with no auth header (anon access).
      clientRef.current = createClerkSupabaseClient(null);
      setIsReady(true);
      return;
    }

    try {
      // Get the raw Clerk session JWT — no custom template needed.
      // Supabase validates it via Third-Party Auth (JWKS endpoint).
      const token = await getToken();
      clientRef.current = createClerkSupabaseClient(token);
    } catch (err) {
      console.warn('[Clerk-Supabase] Failed to get JWT token:', err);
      clientRef.current = createClerkSupabaseClient(null);
    } finally {
      setIsReady(true);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    refreshClient();
  }, [refreshClient]);

  // Stable reference — consumers read clientRef.current.
  const client = useMemo(() => {
    if (clientRef.current) return clientRef.current;
    // Return an anonymous client as fallback during initial load.
    return createClerkSupabaseClient(null);
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return { client, isReady, refreshClient };
}
