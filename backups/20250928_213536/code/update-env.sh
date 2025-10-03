#!/bin/bash

echo "🔧 Updating .env.local with actual Supabase credentials..."

# Backup existing file
cp .env.local .env.local.backup

# Create new .env.local with actual values
cat > .env.local << 'ENVEOF'
# Environment Variables for Development
# Updated with actual Supabase credentials

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
ENVEOF

echo "✅ Updated .env.local with actual Supabase credentials"
echo "📋 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Check the browser console for any remaining errors"
