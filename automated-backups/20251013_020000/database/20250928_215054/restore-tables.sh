#!/bin/bash

# Individual Table Restoration Script
# Use this script to restore specific tables

echo "🔄 Starting Table Restoration"
echo "============================="

TABLES=("profiles" "user_stages" "stage_transitions" "admin_notes" "user_rejections" "dropdown_options" "interviews" "jobs" "user_jobs")

for table in "${TABLES[@]}"; do
    if [ -f "${table}.sql" ]; then
        echo "📊 Restoring table: ${table}"
        supabase db reset --db-url "your_database_url_here" < "${table}.sql"
    else
        echo "⚠️  Table backup not found: ${table}.sql"
    fi
done

echo "✅ Table restoration completed!"
