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
import {
  createClerkSupabaseClient,
  CLERK_SUPABASE_JWT_TEMPLATE,
} from '@/lib/clerk';
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

    const token = await getToken({ template: CLERK_SUPABASE_JWT_TEMPLATE });
    clientRef.current = createClerkSupabaseClient(token);
    setIsReady(true);
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
