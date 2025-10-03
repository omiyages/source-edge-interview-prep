#!/bin/bash

# Deploy Edge Function Fix Script
echo "🚀 Deploying admin-user-management Edge Function fix..."

# Check if supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    
    # Check if logged in
    if supabase projects list &> /dev/null; then
        echo "✅ Supabase CLI authenticated"
        echo "🔄 Deploying function..."
        supabase functions deploy admin-user-management
        echo "✅ Function deployed successfully!"
    else
        echo "❌ Not logged in to Supabase CLI"
        echo "🔧 Please run: supabase login"
        echo "📋 Or deploy manually through Supabase Dashboard"
    fi
else
    echo "❌ Supabase CLI not found"
    echo "📋 Please deploy manually through Supabase Dashboard"
fi

echo ""
echo "📖 Manual deployment steps:"
echo "1. Go to Supabase Dashboard > Edge Functions"
echo "2. Find 'admin-user-management' function"
echo "3. Click 'Edit'"
echo "4. Replace content with updated code from:"
echo "   supabase/functions/admin-user-management/index.ts"
echo "5. Click 'Deploy'"
echo ""
echo "🧪 Test the fix by creating a user in the admin dashboard"
