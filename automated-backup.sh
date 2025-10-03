#!/bin/bash

# Automated Backup Script - Every 3 Days
# Creates comprehensive backups of your source-edge-interview-prep project

set -e

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="automated-backups/${BACKUP_DATE}"
LOG_FILE="automated-backups/backup.log"
PROJECT_NAME="source-edge-interview-prep"
RETENTION_DAYS=21  # Keep backups for 21 days (7 backup cycles)

echo "🤖 Starting Automated Backup"
echo "============================"
echo "📅 Backup Date: $(date)"
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📋 Log File: ${LOG_FILE}"
echo ""

# Create backup directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "automated-backups"
mkdir -p "quick-backup"

# Log backup start
echo "$(date): Starting automated backup" >> "${LOG_FILE}"

# 1. CODE BACKUP
echo "💾 Backing up source code..."
echo "----------------------------"

# Create a clean copy of essential files
cp -r src "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  src directory not found"
cp package.json "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  package.json not found"
cp vite.config.ts "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  vite.config.ts not found"
cp vercel.json "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  vercel.json not found"
cp tailwind.config.ts "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  tailwind.config.ts not found"
cp tsconfig*.json "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  tsconfig files not found"
cp index.html "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  index.html not found"

# Copy configuration files
cp -r .github "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  .github not found"
cp public/_headers "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  _headers not found"
cp env.template "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  env.template not found"

# Copy security configurations
cp *.json "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  JSON configs not found"
cp *.md "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  Markdown files not found"

echo "✅ Source code backed up"

# 2. GIT REPOSITORY BACKUP
echo "📦 Backing up Git repository..."
echo "-------------------------------"

# Create a lightweight Git backup
git log --oneline -10 > "${BACKUP_DIR}/git-history.txt" 2>/dev/null || echo "⚠️  Git history not available"
git branch -a > "${BACKUP_DIR}/git-branches.txt" 2>/dev/null || echo "⚠️  Git branches not available"
git remote -v > "${BACKUP_DIR}/git-remotes.txt" 2>/dev/null || echo "⚠️  Git remotes not available"

echo "✅ Git repository information backed up"

# 3. DATABASE BACKUP (Full Database)
echo "🗃️  Backing up database..."
echo "-------------------------"

# Create database backup directory
mkdir -p "${BACKUP_DIR}/database"

# Run database backup script
echo "📊 Running database backup..."
./backup-database.sh >> "${LOG_FILE}" 2>&1 || echo "⚠️  Database backup failed"

# Copy database backup to main backup
cp -r database-backups/* "${BACKUP_DIR}/database/" 2>/dev/null || echo "⚠️  No database backups found"

# Copy all SQL files
cp *.sql "${BACKUP_DIR}/database/" 2>/dev/null || echo "⚠️  No SQL files found"

# Create database backup script
cat > "${BACKUP_DIR}/database/backup-database.sql" << 'EOF'
-- Automated Database Backup Script
-- Run this script to backup your Supabase database

-- Export all tables
\copy (SELECT * FROM profiles) TO 'profiles_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_stages) TO 'user_stages_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM stage_transitions) TO 'stage_transitions_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM admin_notes) TO 'admin_notes_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_rejections) TO 'user_rejections_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM dropdown_options) TO 'dropdown_options_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM interviews) TO 'interviews_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM jobs) TO 'jobs_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_jobs) TO 'user_jobs_backup.csv' WITH CSV HEADER;

-- Export functions
\copy (SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_schema = 'public') TO 'functions_backup.csv' WITH CSV HEADER;

-- Export policies
\copy (SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies) TO 'policies_backup.csv' WITH CSV HEADER;
EOF

echo "✅ Database backup scripts created"

# 4. ASSETS BACKUP
echo "🖼️  Backing up assets..."
echo "------------------------"

# Backup public assets
cp -r public "${BACKUP_DIR}/" 2>/dev/null || echo "⚠️  public directory not found"

echo "✅ Assets backed up"

# 5. CREATE BACKUP MANIFEST
echo "📋 Creating backup manifest..."
echo "-----------------------------"

cat > "${BACKUP_DIR}/BACKUP_MANIFEST.txt" << EOF
Automated Backup Manifest
========================

Backup Date: $(date)
Project: ${PROJECT_NAME}
Backup Type: Automated (Every 3 Days)
Retention: ${RETENTION_DAYS} days

Backup Contents:
- Source Code: ${BACKUP_DIR}/src/
- Configuration: ${BACKUP_DIR}/*.json, *.ts
- Git Info: ${BACKUP_DIR}/git-*.txt
- Database Scripts: ${BACKUP_DIR}/database/
- Assets: ${BACKUP_DIR}/public/

Restoration Instructions:
1. Extract backup: tar -xzf automated-backup-${BACKUP_DATE}.tar.gz
2. Restore code: cp -r ${BACKUP_DIR}/src /path/to/restore/
3. Restore config: cp ${BACKUP_DIR}/*.json /path/to/restore/
4. Restore database: Run scripts in ${BACKUP_DIR}/database/

Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

echo "✅ Backup manifest created"

# 6. CREATE COMPRESSED ARCHIVE
echo "📦 Creating compressed archive..."
echo "---------------------------------"

cd automated-backups
tar -czf "automated-backup-${BACKUP_DATE}.tar.gz" "${BACKUP_DATE}"
cd - > /dev/null

echo "✅ Compressed archive created: automated-backups/automated-backup-${BACKUP_DATE}.tar.gz"

# 7. CLEANUP OLD BACKUPS
echo "🧹 Cleaning up old backups..."
echo "-----------------------------"

# Remove backups older than retention period
find automated-backups -name "automated-backup-*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || echo "⚠️  No old backups to clean"

echo "✅ Old backups cleaned up"

# 8. BACKUP SUMMARY
echo ""
echo "📊 Automated Backup Summary"
echo "=========================="
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📦 Compressed Archive: automated-backups/automated-backup-${BACKUP_DATE}.tar.gz"
echo "💾 Total Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"
echo "📋 Manifest: ${BACKUP_DIR}/BACKUP_MANIFEST.txt"
echo "🗑️  Retention: ${RETENTION_DAYS} days"
echo ""

# Log backup completion
echo "$(date): Automated backup completed successfully" >> "${LOG_FILE}"

echo "✅ Automated backup completed successfully!"
echo ""
echo "📋 Backup Details:"
echo "- Archive: automated-backups/automated-backup-${BACKUP_DATE}.tar.gz"
echo "- Size: $(du -sh automated-backups/automated-backup-${BACKUP_DATE}.tar.gz | cut -f1)"
echo "- Log: ${LOG_FILE}"
echo "- Next backup: In 3 days"
