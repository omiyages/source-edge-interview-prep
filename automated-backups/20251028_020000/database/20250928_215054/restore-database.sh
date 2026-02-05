#!/bin/bash

# Database Restoration Script
# Use this script to restore your Supabase database

echo "🔄 Starting Database Restoration"
echo "================================"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "Run: npm install -g supabase"
    exit 1
fi

# Check if backup files exist
if [ ! -f "complete.sql" ]; then
    echo "❌ Complete database backup not found: complete.sql"
    exit 1
fi

echo "📊 Restoring complete database..."
supabase db reset --db-url "your_database_url_here" < complete.sql

echo "✅ Database restoration completed!"
echo ""
echo "📋 Restoration Summary:"
echo "- Schema: Restored from schema.sql"
echo "- Data: Restored from data.sql"
echo "- Functions: Restored from functions.sql"
echo "- Policies: Restored from policies.sql"
