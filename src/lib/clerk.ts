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
let _tokenProvider: (() => Promise<string | null>) | null = null;
let _tokenExpMs: number | null = null;

function safeParseJwtExpMs(token: string): number | null {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof json.exp !== 'number') return null;
    return json.exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Update the Clerk JWT used by the singleton Supabase client.
 * Call this whenever the Clerk session token changes.
 */
export function setClerkToken(token: string | null) {
  _currentToken = token;
  _tokenExpMs = token ? safeParseJwtExpMs(token) : null;
}

/**
 * Register a token provider used to refresh Clerk JWTs for outgoing requests.
 * Useful when cached tokens expire during long-lived sessions.
 */
export function setClerkTokenProvider(provider: (() => Promise<string | null>) | null) {
  _tokenProvider = provider;
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
      fetch: async (input, init = {}) => {
        // Refresh only when missing or close to expiry (avoid token endpoint spam / 429s).
        if (_tokenProvider) {
          const now = Date.now();
          const expMs = _tokenExpMs ?? (_currentToken ? safeParseJwtExpMs(_currentToken) : null);
          const shouldRefresh = !_currentToken || !expMs || expMs - now < 90_000;
          if (shouldRefresh) {
            try {
              const next = await _tokenProvider();
              _currentToken = next;
              _tokenExpMs = next ? safeParseJwtExpMs(next) : null;
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[Clerk-Supabase] Failed to refresh request token:', err);
            }
          }
        }

        const headers = new Headers(init.headers);
        // PostgREST requires apikey for all REST requests.
        // Supabase JS normally sets it, but our custom fetch must guarantee it’s present.
        if (!headers.has('apikey')) headers.set('apikey', SUPABASE_ANON_KEY);
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
        if (_currentToken) {
          headers.set('Authorization', `Bearer ${_currentToken}`);
        }
        const res = await fetch(input, { ...init, headers });
        // Help debug PostgREST/Edge Function failures in production.
        // Clone is safe; it won’t consume the body used by supabase-js.
        if (!res.ok) {
          try {
            const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
            const text = await res.clone().text();
            // eslint-disable-next-line no-console
            console.warn('[Supabase] request failed', { url, status: res.status, body: text.slice(0, 3000) });
          } catch {
            // ignore
          }
        }
        return res;
      },
    },
  }
);
