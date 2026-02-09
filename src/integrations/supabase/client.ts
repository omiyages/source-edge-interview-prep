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
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Security: Auto refresh tokens
    autoRefreshToken: true,
    // Security: Persist session in localStorage
    persistSession: true,
    // Security: Detect session in URL
    detectSessionInUrl: true,
  },
  // Security: Global headers for all requests
  global: {
    headers: {
      'X-Client-Info': 'source-edge-interview-prep',
    },
  },
});
