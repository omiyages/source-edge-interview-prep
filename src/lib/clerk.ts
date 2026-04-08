/**
 * Clerk Configuration & Supabase Integration
 *
 * Single Supabase client singleton with a dynamic Clerk JWT injected via
 * custom fetch.  This avoids creating multiple GoTrueClient instances
 * (which triggers "Multiple GoTrueClient instances detected" warnings).
 *
 * Supabase validates the raw Clerk session JWT via Third-Party Auth (JWKS).
 * No custom JWT template is needed.
 *
 * Setup required in Supabase Dashboard → Authentication → Third-Party Auth:
 *   Provider: Clerk
 *   JWKS URL: https://clerk.omiyages.com/.well-known/jwks.json
 *
 * RLS policies use clerk_uid() which returns auth.jwt() ->> 'sub'
 * (the Clerk user ID, e.g. "user_2abc"), which matches profiles.id.
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { environment } from '@/config/environment';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = environment.supabase;

// Module-level token — updated by setClerkToken() from useClerkSupabase.
let _currentToken: string | null = null;

/**
 * Update the Clerk JWT used by the singleton Supabase client.
 * Call this whenever the Clerk session token changes.
 */
export function setClerkToken(token: string | null) {
  _currentToken = token;
}

/**
 * Singleton Supabase client.  The Clerk JWT is injected dynamically via
 * a custom fetch wrapper so only one GoTrueClient is ever created.
 */
export const clerkSupabaseClient: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Disable Supabase's own auth — we manage auth entirely via Clerk JWTs.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionFromUrl: false,
    },
    global: {
      headers: { 'X-Client-Info': 'source-edge-interview-prep' },
      fetch: (input, init = {}) => {
        const headers = new Headers(init.headers);
        // PostgREST requires apikey for all REST requests.
        // Supabase JS normally sets it, but our custom fetch must guarantee it’s present.
        if (!headers.has('apikey')) headers.set('apikey', SUPABASE_ANON_KEY);
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
        if (_currentToken) {
          headers.set('Authorization', `Bearer ${_currentToken}`);
        }
        return fetch(input, { ...init, headers });
      },
    },
  }
);
