#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Verifies that Supabase modules are working correctly
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔗 Testing Supabase Connection...');

try {
  // Test Supabase client creation
  const supabase = createClient(
    'https://satshobhbkjptsbmfsia.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c'
  );

  console.log('✅ Supabase client created successfully');
  console.log('🔗 Supabase URL:', supabase.supabaseUrl);
  console.log('🔑 Supabase Key:', supabase.supabaseKey.substring(0, 20) + '...');
  
  // Test a simple query
  supabase.from('profiles').select('count').then(({ data, error }) => {
    if (error) {
      console.log('⚠️  Query test failed:', error.message);
    } else {
      console.log('✅ Supabase query test successful');
    }
  });

} catch (error) {
  console.error('❌ Supabase connection failed:', error.message);
  process.exit(1);
}

console.log('🎉 Supabase connection test completed!');
