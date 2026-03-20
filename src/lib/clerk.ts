/**
 * Clerk Configuration & Supabase Integration
 *
 * Provides a helper to create a Supabase client authenticated with a
 * Clerk-issued JWT.  Supabase validates the raw Clerk session JWT via
 * Third-Party Auth (JWKS).  No custom JWT template is needed.
 *
 * Setup required in Supabase Dashboard → Authentication → Third-Party Auth:
 *   Provider: Clerk
 *   JWKS URL: https://clerk.omiyages.com/.well-known/jwks.json
 *
 * RLS policies use clerk_uid() which returns auth.jwt() ->> 'sub'
 * (the Clerk user ID, e.g. "user_2abc"), which matches profiles.id.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { environment } from '@/config/environment';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = environment.supabase;

/**
 * Create a Supabase client that sends the Clerk-issued JWT in the
 * Authorization header.  This allows RLS policies that reference
 * `auth.uid()` to resolve to the user's Supabase UUID.
 *
 * Usage:
 *   const { getToken } = useAuth();           // Clerk's useAuth
 *   const token = await getToken({ template: 'supabase' });
 *   const client = createClerkSupabaseClient(token);
 *   const { data } = await client.from('profiles').select('*');
 */
export function createClerkSupabaseClient(clerkToken: string | null) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
        'X-Client-Info': 'source-edge-interview-prep',
      },
    },
  });
}

