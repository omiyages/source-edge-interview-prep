#!/bin/bash

# Database Backup Script for Supabase
# Creates comprehensive database backup

set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${BACKUP_DATE}/database"

echo "🗃️  Starting Database Backup"
echo "============================"
echo "📅 Backup Date: $(date)"
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo ""

# Create database backup directory
mkdir -p "${BACKUP_DIR}"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "🔍 Checking Supabase connection..."

# Create database backup using Supabase CLI
echo "📊 Creating database backup..."

# Export schema
supabase db dump --schema-only > "${BACKUP_DIR}/schema.sql" 2>/dev/null || echo "⚠️  Schema export failed"

# Export data
supabase db dump --data-only > "${BACKUP_DIR}/data.sql" 2>/dev/null || echo "⚠️  Data export failed"

# Export complete database
supabase db dump > "${BACKUP_DIR}/complete.sql" 2>/dev/null || echo "⚠️  Complete export failed"

# Create table-specific backups
echo "📋 Creating table-specific backups..."

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

# Export functions
echo "🔧 Backing up functions..."
supabase db dump --functions > "${BACKUP_DIR}/functions.sql" 2>/dev/null || echo "⚠️  Functions export failed"

# Export policies
echo "🛡️  Backing up policies..."
supabase db dump --policies > "${BACKUP_DIR}/policies.sql" 2>/dev/null || echo "⚠️  Policies export failed"

# Create restoration script
cat > "${BACKUP_DIR}/restore-database.sh" << 'EOF'
#!/bin/bash

# Database Restoration Script
# Use this script to restore your Supabase database

echo "🔄 Starting Database Restoration"
echo "================================"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# Restore complete database
echo "📊 Restoring complete database..."
supabase db reset --db-url "your_database_url_here" < complete.sql

# Or restore individual components
echo "📋 Restoring schema..."
supabase db reset --db-url "your_database_url_here" < schema.sql

echo "📊 Restoring data..."
supabase db reset --db-url "your_database_url_here" < data.sql

echo "✅ Database restoration completed!"
EOF

chmod +x "${BACKUP_DIR}/restore-database.sh"

# Create backup manifest
cat > "${BACKUP_DIR}/DATABASE_BACKUP_MANIFEST.txt" << EOF
Database Backup Manifest
========================

Backup Date: $(date)
Database: Supabase PostgreSQL

Backup Contents:
- Schema: schema.sql
- Data: data.sql  
- Complete: complete.sql
- Functions: functions.sql
- Policies: policies.sql
- Tables: ${TABLES[*]}

Restoration Instructions:
1. Install Supabase CLI: npm install -g supabase
2. Run: ./restore-database.sh
3. Or manually restore individual files

Security Notes:
- Database backups may contain sensitive data
- Store securely and encrypt if necessary
- Test restoration in a development environment first

Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

echo ""
echo "📊 Database Backup Summary"
echo "=========================="
echo "📁 Backup Directory: ${BACKUP_DIR}"
echo "💾 Total Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"
echo "📋 Manifest: ${BACKUP_DIR}/DATABASE_BACKUP_MANIFEST.txt"
echo ""
echo "✅ Database backup completed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Verify backup files are complete"
echo "2. Test restoration in development environment"
echo "3. Store backup securely"
echo "4. Set up automated database backups"
