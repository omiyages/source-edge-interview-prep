// Secure Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { environment } from '@/config/environment';

// Validate environment configuration
const configValidation = environment.validateSecrets();
if (!configValidation.isValid) {
  console.error('❌ Environment configuration errors:', configValidation.errors);
  if (import.meta.env.PROD) {
    throw new Error('Invalid environment configuration in production');
  }
}

// Get secure configuration from environment manager
const { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISHABLE_KEY } = environment.supabase;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase configuration');
}

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

// Security: Add request/response interceptors for monitoring
if (environment.security.debugMode) {
  console.log('🔐 Supabase client initialized with secure configuration');
  console.log('📊 Environment validation:', configValidation);
}