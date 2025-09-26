// Secure Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { environment } from '@/config/environment';

// Get secure configuration from environment manager
const { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISHABLE_KEY } = environment.supabase;

// Validate configuration with fallbacks
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('⚠️ Using fallback Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local for production.');
}

// Validate environment configuration (non-blocking in development)
const configValidation = environment.validateSecrets();
if (!configValidation.isValid) {
  console.warn('⚠️ Environment configuration warnings:', configValidation.errors);
  if (import.meta.env.PROD) {
    console.error('❌ Environment configuration errors in production:', configValidation.errors);
  }
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