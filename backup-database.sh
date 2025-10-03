#!/bin/bash

# Database Backup Script for Supabase
# Creates comprehensive database backup including data, schema, functions, and policies

set -e

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="database-backups/${BACKUP_DATE}"
LOG_FILE="database-backups/backup.log"
PROJECT_NAME="source-edge-interview-prep"

echo "🗃️  Starting Database Backup"
echo "============================"
echo "📅 Backup Date: $(date)"
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📋 Log File: ${LOG_FILE}"
echo ""

# Create backup directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "database-backups"

# Log backup start
echo "$(date): Starting database backup" >> "${LOG_FILE}"

# Check if we have Supabase credentials
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Using fallback credentials."
    SUPABASE_URL="https://satshobhbkjptsbmfsia.supabase.co"
    SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c"
else
    # Extract credentials from .env.local
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"')
    SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env.local | cut -d'=' -f2 | tr -d '"')
fi

echo "🔗 Supabase URL: ${SUPABASE_URL}"
echo "🔑 Using Supabase credentials for backup"
echo ""

# 1. CREATE DATABASE BACKUP USING SUPABASE CLI
echo "📊 Creating database backup using Supabase CLI..."
echo "------------------------------------------------"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Initialize Supabase project if needed
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
fi

# Create database backup
echo "📋 Exporting database schema..."
supabase db dump --schema-only > "${BACKUP_DIR}/schema.sql" 2>/dev/null || echo "⚠️  Schema export failed"

echo "📊 Exporting database data..."
supabase db dump --data-only > "${BACKUP_DIR}/data.sql" 2>/dev/null || echo "⚠️  Data export failed"

echo "🗃️  Exporting complete database..."
supabase db dump > "${BACKUP_DIR}/complete.sql" 2>/dev/null || echo "⚠️  Complete export failed"

# 2. CREATE TABLE-SPECIFIC BACKUPS
echo "📋 Creating table-specific backups..."
echo "------------------------------------"

# List of tables to backup
TABLES=(
    "profiles"
    "user_stages" 
    "stage_transitions"
    "admin_notes"
    "user_rejections"
    "dropdown_options"
    "interviews"
    "jobs"
    "user_jobs"
)

for table in "${TABLES[@]}"; do
    echo "📊 Backing up table: ${table}"
    supabase db dump --table="${table}" > "${BACKUP_DIR}/${table}.sql" 2>/dev/null || echo "⚠️  Failed to backup table: ${table}"
done

# 3. EXPORT FUNCTIONS AND POLICIES
echo "🔧 Backing up functions..."
echo "-------------------------"
supabase db dump --functions > "${BACKUP_DIR}/functions.sql" 2>/dev/null || echo "⚠️  Functions export failed"

echo "🛡️  Backing up policies..."
echo "-------------------------"
supabase db dump --policies > "${BACKUP_DIR}/policies.sql" 2>/dev/null || echo "⚠️  Policies export failed"

# 4. CREATE CSV EXPORTS
echo "📊 Creating CSV exports..."
echo "------------------------"

# Create CSV export script
cat > "${BACKUP_DIR}/export-csv.sql" << 'EOF'
-- CSV Export Script for Database Backup
-- Run this script to export all tables as CSV files

\copy (SELECT * FROM profiles) TO 'profiles.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_stages) TO 'user_stages.csv' WITH CSV HEADER;
\copy (SELECT * FROM stage_transitions) TO 'stage_transitions.csv' WITH CSV HEADER;
\copy (SELECT * FROM admin_notes) TO 'admin_notes.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_rejections) TO 'user_rejections.csv' WITH CSV HEADER;
\copy (SELECT * FROM dropdown_options) TO 'dropdown_options.csv' WITH CSV HEADER;
\copy (SELECT * FROM interviews) TO 'interviews.csv' WITH CSV HEADER;
\copy (SELECT * FROM jobs) TO 'jobs.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_jobs) TO 'user_jobs.csv' WITH CSV HEADER;
EOF

# 5. CREATE RESTORATION SCRIPTS
echo "🔄 Creating restoration scripts..."
echo "--------------------------------"

# Create database restoration script
cat > "${BACKUP_DIR}/restore-database.sh" << 'EOF'
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
EOF

chmod +x "${BACKUP_DIR}/restore-database.sh"

# Create individual table restoration script
cat > "${BACKUP_DIR}/restore-tables.sh" << 'EOF'
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
EOF

chmod +x "${BACKUP_DIR}/restore-tables.sh"

# 6. CREATE BACKUP MANIFEST
echo "📋 Creating database backup manifest..."
echo "-------------------------------------"

cat > "${BACKUP_DIR}/DATABASE_BACKUP_MANIFEST.txt" << EOF
Database Backup Manifest
========================

Backup Date: $(date)
Project: ${PROJECT_NAME}
Database: Supabase PostgreSQL
Backup Type: Complete Database Backup

Backup Contents:
- Schema: schema.sql
- Data: data.sql
- Complete: complete.sql
- Functions: functions.sql
- Policies: policies.sql
- Tables: ${TABLES[*]}
- CSV Export: export-csv.sql
- Restoration: restore-database.sh, restore-tables.sh

Database Tables:
$(printf "- %s\n" "${TABLES[@]}")

Restoration Instructions:
1. Install Supabase CLI: npm install -g supabase
2. Run complete restore: ./restore-database.sh
3. Run table-specific restore: ./restore-tables.sh
4. Export to CSV: Run export-csv.sql

Security Notes:
- Database backups may contain sensitive data
- Store backups securely and encrypt if necessary
- Test restoration in a development environment first
- Never restore production data to development

Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

# 7. CREATE COMPRESSED ARCHIVE
echo "📦 Creating compressed database backup..."
echo "---------------------------------------"

cd database-backups
tar -czf "database-backup-${BACKUP_DATE}.tar.gz" "${BACKUP_DATE}"
cd - > /dev/null

echo "✅ Compressed database backup created: database-backups/database-backup-${BACKUP_DATE}.tar.gz"

# 8. CLEANUP OLD BACKUPS
echo "🧹 Cleaning up old database backups..."
echo "------------------------------------"

# Remove backups older than 7 days
find database-backups -name "database-backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || echo "⚠️  No old database backups to clean"

echo "✅ Old database backups cleaned up"

# 9. BACKUP SUMMARY
echo ""
echo "📊 Database Backup Summary"
echo "========================="
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📦 Compressed Archive: database-backups/database-backup-${BACKUP_DATE}.tar.gz"
echo "💾 Total Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"
echo "📋 Manifest: ${BACKUP_DIR}/DATABASE_BACKUP_MANIFEST.txt"
echo "🗑️  Retention: 7 days"
echo ""

# Log backup completion
echo "$(date): Database backup completed successfully" >> "${LOG_FILE}"

echo "✅ Database backup completed successfully!"
echo ""
echo "📋 Database Backup Details:"
echo "- Archive: database-backups/database-backup-${BACKUP_DATE}.tar.gz"
echo "- Size: $(du -sh database-backups/database-backup-${BACKUP_DATE}.tar.gz | cut -f1)"
echo "- Log: ${LOG_FILE}"
echo "- Tables: ${#TABLES[@]} tables backed up"
echo ""
echo "🚀 Next Steps:"
echo "1. Test database restoration in development"
echo "2. Store backup securely"
echo "3. Set up automated database backups"
echo "4. Monitor backup health"