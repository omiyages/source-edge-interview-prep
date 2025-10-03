#!/usr/bin/env node

/**
 * Quick Environment Fix Script
 * Helps fix environment variable issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Environment Configuration');
console.log('=' .repeat(40));

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Environment Variables for Development
# Copy your actual values here

# Supabase Configuration
VITE_SUPABASE_URL=https://satshobhbkjptsbmfsia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c

# Google OAuth Configuration (optional)
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_SECRET=
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth2callback
VITE_GOOGLE_SHEET_ID=

# Security Configuration
VITE_SECURITY_HEADERS_ENABLED=true
VITE_RATE_LIMITING_ENABLED=true
VITE_DEBUG_MODE=true

# API Configuration
VITE_API_BASE_URL=
VITE_API_TIMEOUT=30000

# Monitoring Configuration
VITE_MONITORING_ENABLED=true
VITE_ANALYTICS_ID=

# Feature Flags
VITE_FEATURE_KANBAN_ENABLED=true
VITE_FEATURE_BULK_ADD_ENABLED=true
VITE_FEATURE_SECURITY_MONITORING=true
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local file with default values');
} else {
  console.log('✅ .env.local file already exists');
}

// Check if the file has the required variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
if (missingVars.length === 0) {
  console.log('✅ All required environment variables are present');
} else {
  console.log('❌ Missing environment variables:', missingVars);
  console.log('Please add the missing variables to .env.local');
}

// Check for placeholder values
if (envContent.includes('your_supabase_url_here') || envContent.includes('your_supabase_anon_key_here')) {
  console.log('⚠️ Found placeholder values in .env.local');
  console.log('Please replace placeholder values with your actual Supabase credentials');
}

console.log('\n📋 Next Steps:');
console.log('1. Update .env.local with your actual Supabase credentials');
console.log('2. Restart your development server: npm run dev');
console.log('3. Check the browser console for any remaining errors');

console.log('\n🔍 To get your Supabase credentials:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Go to Settings > API');
console.log('3. Copy the Project URL and anon/public key');
console.log('4. Update the values in .env.local');

console.log('\n✅ Environment fix complete!');
