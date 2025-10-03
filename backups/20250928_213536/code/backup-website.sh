#!/bin/bash

# Website Backup Script
# Creates comprehensive backup of your source-edge-interview-prep project

set -e

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${BACKUP_DATE}"
PROJECT_NAME="source-edge-interview-prep"
GITHUB_REPO="https://github.com/omiyages/source-edge-interview-prep.git"

echo "🗄️  Starting Website Backup"
echo "=========================="
echo "📅 Backup Date: $(date)"
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo ""

# Create backup directory structure
mkdir -p "${BACKUP_DIR}"/{code,database,assets,config,logs}

echo "📁 Created backup directory structure"

# 1. CODE BACKUP
echo "💾 Backing up source code..."
echo "----------------------------"

# Create a clean copy of the project
cp -r . "${BACKUP_DIR}/code/" 2>/dev/null || echo "⚠️  Some files could not be copied"

# Remove unnecessary files from backup
cd "${BACKUP_DIR}/code"
rm -rf node_modules .git .vite dist backups
cd - > /dev/null

echo "✅ Source code backed up"

# 2. GIT REPOSITORY BACKUP
echo "📦 Backing up Git repository..."
echo "-------------------------------"

# Create a bare clone for complete Git history
git clone --bare . "${BACKUP_DIR}/git-repo.git" 2>/dev/null || echo "⚠️  Git backup failed"

# Create a regular clone for easy access
git clone . "${BACKUP_DIR}/git-regular" 2>/dev/null || echo "⚠️  Git regular backup failed"

echo "✅ Git repository backed up"

# 3. DATABASE BACKUP
echo "🗃️  Backing up database..."
echo "-------------------------"

# Create database backup script
cat > "${BACKUP_DIR}/database/backup-database.sql" << 'EOF'
-- Database Backup Script
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

echo "✅ Database backup script created"

# 4. CONFIGURATION BACKUP
echo "⚙️  Backing up configuration..."
echo "-------------------------------"

# Backup environment files
cp .env.local "${BACKUP_DIR}/config/" 2>/dev/null || echo "⚠️  .env.local not found"
cp .env "${BACKUP_DIR}/config/" 2>/dev/null || echo "⚠️  .env not found"
cp env.template "${BACKUP_DIR}/config/" 2>/dev/null || echo "⚠️  env.template not found"

# Backup configuration files
cp package.json "${BACKUP_DIR}/config/"
cp vite.config.ts "${BACKUP_DIR}/config/"
cp vercel.json "${BACKUP_DIR}/config/"
cp tailwind.config.ts "${BACKUP_DIR}/config/"
cp tsconfig.json "${BACKUP_DIR}/config/"
cp tsconfig.app.json "${BACKUP_DIR}/config/"
cp tsconfig.node.json "${BACKUP_DIR}/config/"

# Backup security configurations
cp -r .github "${BACKUP_DIR}/config/" 2>/dev/null || echo "⚠️  .github not found"
cp public/_headers "${BACKUP_DIR}/config/" 2>/dev/null || echo "⚠️  _headers not found"

echo "✅ Configuration files backed up"

# 5. ASSETS BACKUP
echo "🖼️  Backing up assets..."
echo "------------------------"

# Backup public assets
cp -r public "${BACKUP_DIR}/assets/" 2>/dev/null || echo "⚠️  public directory not found"

# Backup any uploaded files
cp -r dist "${BACKUP_DIR}/assets/" 2>/dev/null || echo "⚠️  dist directory not found"

echo "✅ Assets backed up"

# 6. CREATE BACKUP MANIFEST
echo "📋 Creating backup manifest..."
echo "-----------------------------"

cat > "${BACKUP_DIR}/BACKUP_MANIFEST.txt" << EOF
Website Backup Manifest
======================

Backup Date: $(date)
Project: ${PROJECT_NAME}
GitHub Repository: ${GITHUB_REPO}

Backup Contents:
- Source Code: ${BACKUP_DIR}/code/
- Git Repository: ${BACKUP_DIR}/git-repo.git
- Git Regular: ${BACKUP_DIR}/git-regular/
- Database Scripts: ${BACKUP_DIR}/database/
- Configuration: ${BACKUP_DIR}/config/
- Assets: ${BACKUP_DIR}/assets/

Restoration Instructions:
1. To restore code: cp -r ${BACKUP_DIR}/code/* /path/to/restore/
2. To restore Git: git clone ${BACKUP_DIR}/git-repo.git
3. To restore database: Run scripts in ${BACKUP_DIR}/database/
4. To restore config: cp ${BACKUP_DIR}/config/* /path/to/restore/

Security Notes:
- Environment files may contain sensitive data
- Review before restoring
- Update environment variables after restoration

Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

echo "✅ Backup manifest created"

# 7. CREATE COMPRESSED ARCHIVE
echo "📦 Creating compressed archive..."
echo "---------------------------------"

cd backups
tar -czf "${BACKUP_DATE}_website_backup.tar.gz" "${BACKUP_DATE}"
cd - > /dev/null

echo "✅ Compressed archive created: backups/${BACKUP_DATE}_website_backup.tar.gz"

# 8. BACKUP SUMMARY
echo ""
echo "📊 Backup Summary"
echo "================="
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "📦 Compressed Archive: backups/${BACKUP_DATE}_website_backup.tar.gz"
echo "💾 Total Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"
echo "📋 Manifest: ${BACKUP_DIR}/BACKUP_MANIFEST.txt"
echo ""
echo "✅ Website backup completed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Test the backup by extracting the archive"
echo "2. Store the backup in a secure location"
echo "3. Consider setting up automated backups"
echo "4. Test restoration procedures"
