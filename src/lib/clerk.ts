/**
 * Clerk Configuration & Supabase Integration
 *
 * Provides a helper to create a Supabase client authenticated with a
 * Clerk-issued JWT.  The JWT template named "supabase" must be configured
 * in the Clerk dashboard with:
 *   {
 *     "sub": "{{user.public_metadata.supabase_uuid}}",
 *     "role": "authenticated",
 *     "aud": "authenticated",
 *     "iss": "supabase"
 *   }
 *
 * The Supabase project's JWT secret must be set to the signing key from
 * this Clerk JWT template so that `auth.uid()` in RLS resolves to the
 * user's Supabase UUID.
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

/** The Clerk JWT template name configured in the Clerk dashboard. */
export const CLERK_SUPABASE_JWT_TEMPLATE = 'supabase';
