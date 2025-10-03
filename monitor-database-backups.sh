#!/bin/bash

# Database Backup Monitor
# Monitors database backup health and provides status

BACKUP_DIR="database-backups"
LOG_FILE="database-backups/backup.log"

echo "🗃️  Database Backup Monitor"
echo "==========================="
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Database backup directory not found: $BACKUP_DIR"
    echo "🔧 Run: ./backup-database.sh to create database backup"
    exit 1
fi

# Find the most recent database backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/database-backup-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No database backups found"
    echo "🔧 Run: ./backup-database.sh to create database backup"
    exit 1
fi

# Get backup info
BACKUP_NAME=$(basename "$LATEST_BACKUP")
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LATEST_BACKUP")

echo "📊 Latest Database Backup:"
echo "--------------------------"
echo "📦 File: $BACKUP_NAME"
echo "📅 Date: $BACKUP_DATE"
echo "💾 Size: $BACKUP_SIZE"
echo ""

# Check backup age
BACKUP_TIMESTAMP=$(stat -f "%m" "$LATEST_BACKUP")
CURRENT_TIMESTAMP=$(date +%s)
AGE_SECONDS=$((CURRENT_TIMESTAMP - BACKUP_TIMESTAMP))
AGE_DAYS=$((AGE_SECONDS / 86400))

echo "⏰ Backup Age: $AGE_DAYS days"

if [ $AGE_DAYS -gt 3 ]; then
    echo "⚠️  Warning: Database backup is older than 3 days"
    echo "🔧 Run: ./backup-database.sh to create fresh backup"
else
    echo "✅ Database backup is recent and healthy"
fi

echo ""

# Show all database backups
echo "📋 All Database Backups:"
echo "------------------------"
ls -la "$BACKUP_DIR"/database-backup-*.tar.gz 2>/dev/null | while read line; do
    echo "🗃️  $line"
done

echo ""

# Check database backup contents
echo "🔍 Database Backup Contents:"
echo "----------------------------"
if [ -f "$LATEST_BACKUP" ]; then
    echo "📦 Extracting backup contents..."
    TEMP_DIR=$(mktemp -d)
    tar -tzf "$LATEST_BACKUP" | head -20 | while read file; do
        echo "📄 $file"
    done
    rm -rf "$TEMP_DIR"
fi

echo ""

# Check database connection
echo "🔗 Database Connection Status:"
echo "-----------------------------"
if [ -f ".env.local" ]; then
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"')
    if [ ! -z "$SUPABASE_URL" ]; then
        echo "✅ Supabase URL configured: $SUPABASE_URL"
    else
        echo "⚠️  Supabase URL not found in .env.local"
    fi
else
    echo "⚠️  .env.local not found"
fi

echo ""

# Show restoration instructions
echo "🔄 Database Restoration Instructions:"
echo "------------------------------------"
echo "1. Extract backup: tar -xzf $LATEST_BACKUP"
echo "2. Navigate to backup directory"
echo "3. Run restoration script: ./restore-database.sh"
echo "4. Or restore individual tables: ./restore-tables.sh"

echo ""
echo "📋 Log File: $LOG_FILE"
echo "🔍 To view recent logs: tail -20 $LOG_FILE"
echo "🔧 To create new backup: ./backup-database.sh"
