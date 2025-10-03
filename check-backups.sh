#!/bin/bash

# Simple Backup Monitor for macOS
# Checks automated backup status

BACKUP_DIR="automated-backups"
LOG_FILE="automated-backups/backup.log"

echo "🔍 Automated Backup Status"
echo "========================="
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Find the most recent backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/automated-backup-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No automated backups found"
    exit 1
fi

# Get backup info
BACKUP_NAME=$(basename "$LATEST_BACKUP")
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LATEST_BACKUP")

echo "📊 Latest Backup:"
echo "-----------------"
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

if [ $AGE_DAYS -gt 4 ]; then
    echo "⚠️  Warning: Backup is older than 4 days"
else
    echo "✅ Backup is recent and healthy"
fi

echo ""

# Show all backups
echo "📋 All Backups:"
echo "---------------"
ls -la "$BACKUP_DIR"/automated-backup-*.tar.gz 2>/dev/null | while read line; do
    echo "📦 $line"
done

echo ""

# Check cron job
echo "⏰ Cron Job Status:"
echo "------------------"
if crontab -l 2>/dev/null | grep -q "automated-backup.sh"; then
    echo "✅ Automated backup cron job is active"
    echo "📅 Schedule: Every 3 days at 2:00 AM"
else
    echo "❌ No automated backup cron job found"
    echo "🔧 Run: ./setup-cron-backup.sh to set up automated backups"
fi

echo ""
echo "📋 Log File: $LOG_FILE"
echo "🔍 To view recent logs: tail -20 $LOG_FILE"
