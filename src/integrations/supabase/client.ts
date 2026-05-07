// Secure Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { environment } from '@/config/environment';

// Get secure configuration from environment manager
const { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISHABLE_KEY } = environment.supabase;

// Validate configuration with fallbacks
// Validate configuration
const configValidation = environment.validateSecrets();

// Create Supabase client with secure configuration
// Auth is managed entirely by Clerk — disable Supabase's own GoTrueClient
// to avoid "Multiple GoTrueClient instances" warnings.
// Use clerkSupabaseClient (src/lib/clerk.ts) for any query that needs RLS.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionFromUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'source-edge-interview-prep',
      // Keep default Supabase headers even when overriding global.headers.
      // PostgREST rejects requests without apikey.
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  },
});
