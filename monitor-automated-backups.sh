#!/bin/bash

# Monitor Automated Backups
# Checks backup health and provides status

BACKUP_DIR="automated-backups"
LOG_FILE="automated-backups/backup.log"

echo "🔍 Automated Backup Monitor"
echo "==========================="
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Check last backup
LAST_BACKUP=$(find "$BACKUP_DIR" -name "automated-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2)

if [ -z "$LAST_BACKUP" ]; then
    echo "❌ No automated backups found"
    exit 1
fi

# Check backup age
BACKUP_AGE=$(( $(date +%s) - $(stat -c %Y "$LAST_BACKUP") ))
BACKUP_AGE_DAYS=$(( $BACKUP_AGE / 86400 ))

echo "📊 Backup Status:"
echo "-----------------"
echo "📁 Last Backup: $(basename "$LAST_BACKUP")"
echo "⏰ Backup Age: $BACKUP_AGE_DAYS days"
echo "💾 Backup Size: $(du -h "$LAST_BACKUP" | cut -f1)"

# Check if backup is recent (within 4 days)
if [ $BACKUP_AGE_DAYS -gt 4 ]; then
    echo "⚠️  Warning: Last backup is older than 4 days"
    echo "🔍 Check cron job status: crontab -l"
    echo "📋 Check backup logs: tail -f $LOG_FILE"
else
    echo "✅ Backup is recent and healthy"
fi

# Show backup history
echo ""
echo "📋 Recent Backups:"
echo "------------------"
find "$BACKUP_DIR" -name "automated-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -5 | while read timestamp filepath; do
    backup_date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S")
    backup_size=$(du -h "$filepath" | cut -f1)
    echo "📦 $(basename "$filepath") - $backup_date - $backup_size"
done

# Show cron job status
echo ""
echo "⏰ Cron Job Status:"
echo "------------------"
if crontab -l 2>/dev/null | grep -q "automated-backup.sh"; then
    echo "✅ Automated backup cron job is active"
    crontab -l 2>/dev/null | grep "automated-backup.sh"
else
    echo "❌ No automated backup cron job found"
    echo "🔧 Run: ./setup-cron-backup.sh to set up automated backups"
fi

echo ""
echo "📋 Log File: $LOG_FILE"
echo "🔍 To view recent logs: tail -20 $LOG_FILE"
