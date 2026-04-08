/**
 * Hook: useClerkSupabase
 *
 * Returns the singleton Supabase client with the current Clerk user's JWT
 * injected dynamically.  Calls setClerkToken() whenever the session changes
 * so the singleton's fetch wrapper always sends the latest token.
 *
 * Usage:
 *   const { client, isReady, hasClerkJwt } = useClerkSupabase();
 *   // Wait for isReady before making queries that depend on RLS
 *   const { data } = await client.from('profiles').select('*');
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { clerkSupabaseClient, setClerkToken } from '@/lib/clerk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export function useClerkSupabase() {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);
  /** False when signed in but JWT not yet available — avoid RLS requests with only the anon key (401). */
  const [hasClerkJwt, setHasClerkJwt] = useState(false);

  const refreshClient = useCallback(async () => {
    if (!isSignedIn) {
      setClerkToken(null);
      setHasClerkJwt(false);
      setIsReady(true);
      return;
    }

    try {
      // Get the raw Clerk session JWT — no custom template needed.
      // Supabase validates it via Third-Party Auth (JWKS endpoint).
      const token = await getToken();
      if (token) {
        console.log('[Clerk-Supabase] JWT token acquired, length:', token.length);
      } else {
        console.warn('[Clerk-Supabase] getToken() returned null — user may not be fully signed in');
      }
      setClerkToken(token);
      setHasClerkJwt(Boolean(token));
    } catch (err) {
      console.warn('[Clerk-Supabase] Failed to get JWT token:', err);
      setClerkToken(null);
      setHasClerkJwt(false);
    } finally {
      setIsReady(true);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    refreshClient();
  }, [refreshClient]);

  return {
    client: clerkSupabaseClient as SupabaseClient<Database>,
    isReady,
    hasClerkJwt,
    refreshClient,
  };
}
