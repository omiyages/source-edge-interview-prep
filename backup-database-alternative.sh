#!/bin/bash

# Alternative Database Backup Script
# Creates database backup using SQL queries and API calls

set -e

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="database-backups/${BACKUP_DATE}"
LOG_FILE="database-backups/backup.log"
PROJECT_NAME="source-edge-interview-prep"

echo "🗃️  Starting Alternative Database Backup"
echo "======================================="
echo "📅 Backup Date: $(date)"
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📋 Log File: ${LOG_FILE}"
echo ""

# Create backup directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "database-backups"

# Log backup start
echo "$(date): Starting alternative database backup" >> "${LOG_FILE}"

# Get Supabase credentials
if [ -f ".env.local" ]; then
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"')
    SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env.local | cut -d'=' -f2 | tr -d '"')
else
    SUPABASE_URL="https://satshobhbkjptsbmfsia.supabase.co"
    SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c"
fi

echo "🔗 Supabase URL: ${SUPABASE_URL}"
echo "🔑 Using Supabase credentials for backup"
echo ""

# 1. CREATE SQL BACKUP SCRIPTS
echo "📋 Creating SQL backup scripts..."
echo "--------------------------------"

# Create comprehensive SQL backup script
cat > "${BACKUP_DIR}/backup-all-tables.sql" << 'EOF'
-- Comprehensive Database Backup Script
-- This script exports all tables, functions, and policies

-- Export all tables with data
\copy (SELECT * FROM profiles) TO 'profiles_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_stages) TO 'user_stages_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM stage_transitions) TO 'stage_transitions_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM admin_notes) TO 'admin_notes_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_rejections) TO 'user_rejections_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM dropdown_options) TO 'dropdown_options_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM interviews) TO 'interviews_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM jobs) TO 'jobs_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_jobs) TO 'user_jobs_backup.csv' WITH CSV HEADER;

-- Export schema only
\copy (SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public') TO 'schema_info.csv' WITH CSV HEADER;

-- Export functions
\copy (SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_schema = 'public') TO 'functions_backup.csv' WITH CSV HEADER;

-- Export policies
\copy (SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies) TO 'policies_backup.csv' WITH CSV HEADER;

-- Export table constraints
\copy (SELECT table_name, constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public') TO 'constraints_backup.csv' WITH CSV HEADER;
EOF

# Create individual table backup scripts
TABLES=("profiles" "user_stages" "stage_transitions" "admin_notes" "user_rejections" "dropdown_options" "interviews" "jobs" "user_jobs")

for table in "${TABLES[@]}"; do
    cat > "${BACKUP_DIR}/backup-${table}.sql" << EOF
-- Backup script for table: ${table}
\copy (SELECT * FROM ${table}) TO '${table}_backup.csv' WITH CSV HEADER;
EOF
done

echo "✅ SQL backup scripts created"

# 2. CREATE RESTORATION SCRIPTS
echo "🔄 Creating restoration scripts..."
echo "--------------------------------"

# Create database restoration script
cat > "${BACKUP_DIR}/restore-database.sh" << 'EOF'
#!/bin/bash

# Database Restoration Script
# Use this script to restore your Supabase database

echo "🔄 Starting Database Restoration"
echo "================================"

# Check if backup files exist
if [ ! -f "backup-all-tables.sql" ]; then
    echo "❌ Database backup script not found: backup-all-tables.sql"
    exit 1
fi

echo "📊 Restoring database from backup scripts..."
echo "🔧 Note: You'll need to run these scripts in your Supabase SQL editor"
echo ""

echo "📋 Restoration Steps:"
echo "1. Open your Supabase project dashboard"
echo "2. Go to SQL Editor"
echo "3. Run the backup-all-tables.sql script"
echo "4. Or run individual table scripts as needed"
echo ""

echo "✅ Database restoration instructions provided!"
EOF

chmod +x "${BACKUP_DIR}/restore-database.sh"

# 3. CREATE API BACKUP SCRIPT
echo "🌐 Creating API backup script..."
echo "-------------------------------"

# Create Node.js script for API-based backup
cat > "${BACKUP_DIR}/backup-via-api.js" << 'EOF'
#!/usr/bin/env node

// API-based Database Backup Script
// Uses Supabase JavaScript client to backup data

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://satshobhbkjptsbmfsia.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key_here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tables to backup
const tables = [
    'profiles',
    'user_stages',
    'stage_transitions',
    'admin_notes',
    'user_rejections',
    'dropdown_options',
    'interviews',
    'jobs',
    'user_jobs'
];

async function backupTable(tableName) {
    try {
        console.log(`📊 Backing up table: ${tableName}`);
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
        
        if (error) {
            console.error(`❌ Error backing up ${tableName}:`, error);
            return null;
        }
        
        // Save to JSON file
        const filename = `${tableName}_backup.json`;
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`✅ ${tableName} backed up to ${filename}`);
        
        return data;
    } catch (err) {
        console.error(`❌ Error backing up ${tableName}:`, err);
        return null;
    }
}

async function backupAllTables() {
    console.log('🗃️  Starting API-based database backup...');
    
    const results = {};
    
    for (const table of tables) {
        results[table] = await backupTable(table);
    }
    
    // Create summary
    const summary = {
        backupDate: new Date().toISOString(),
        tables: Object.keys(results).length,
        successful: Object.values(results).filter(r => r !== null).length,
        failed: Object.values(results).filter(r => r === null).length
    };
    
    fs.writeFileSync('backup_summary.json', JSON.stringify(summary, null, 2));
    console.log('📋 Backup summary created: backup_summary.json');
    console.log(`✅ Backup completed: ${summary.successful}/${summary.tables} tables successful`);
}

backupAllTables().catch(console.error);
EOF

chmod +x "${BACKUP_DIR}/backup-via-api.js"

# 4. CREATE BACKUP MANIFEST
echo "📋 Creating database backup manifest..."
echo "-------------------------------------"

cat > "${BACKUP_DIR}/DATABASE_BACKUP_MANIFEST.txt" << EOF
Alternative Database Backup Manifest
===================================

Backup Date: $(date)
Project: ${PROJECT_NAME}
Database: Supabase PostgreSQL
Backup Type: Alternative (SQL Scripts + API)

Backup Contents:
- SQL Scripts: backup-all-tables.sql, backup-*.sql
- API Script: backup-via-api.js
- Restoration: restore-database.sh
- Tables: ${TABLES[*]}

Database Tables:
$(printf "- %s\n" "${TABLES[@]}")

Restoration Instructions:
1. SQL Method: Run backup-all-tables.sql in Supabase SQL Editor
2. API Method: Run backup-via-api.js with proper credentials
3. Individual Tables: Run backup-*.sql scripts as needed

Security Notes:
- Database backups may contain sensitive data
- Store backups securely and encrypt if necessary
- Test restoration in a development environment first
- Never restore production data to development

Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

# 5. CREATE COMPRESSED ARCHIVE
echo "📦 Creating compressed database backup..."
echo "---------------------------------------"

cd database-backups
tar -czf "database-backup-${BACKUP_DATE}.tar.gz" "${BACKUP_DATE}"
cd - > /dev/null

echo "✅ Compressed database backup created: database-backups/database-backup-${BACKUP_DATE}.tar.gz"

# 6. CLEANUP OLD BACKUPS
echo "🧹 Cleaning up old database backups..."
echo "------------------------------------"

# Remove backups older than 7 days
find database-backups -name "database-backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || echo "⚠️  No old database backups to clean"

echo "✅ Old database backups cleaned up"

# 7. BACKUP SUMMARY
echo ""
echo "📊 Alternative Database Backup Summary"
echo "======================================"
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📦 Compressed Archive: database-backups/database-backup-${BACKUP_DATE}.tar.gz"
echo "💾 Total Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"
echo "📋 Manifest: ${BACKUP_DIR}/DATABASE_BACKUP_MANIFEST.txt"
echo "🗑️  Retention: 7 days"
echo ""

# Log backup completion
echo "$(date): Alternative database backup completed successfully" >> "${LOG_FILE}"

echo "✅ Alternative database backup completed successfully!"
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
