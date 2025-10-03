#!/bin/bash

# Setup Cron Job for Automated Backups Every 3 Days
# This script sets up automated backups to run every 3 days

set -e

echo "⏰ Setting up Automated Backup Cron Job"
echo "======================================="
echo ""

# Get the current directory
CURRENT_DIR=$(pwd)
BACKUP_SCRIPT="${CURRENT_DIR}/automated-backup.sh"
LOG_FILE="${CURRENT_DIR}/automated-backups/backup.log"

echo "📁 Current Directory: ${CURRENT_DIR}"
echo "📜 Backup Script: ${BACKUP_SCRIPT}"
echo "📋 Log File: ${LOG_FILE}"
echo ""

# Check if backup script exists
if [ ! -f "${BACKUP_SCRIPT}" ]; then
    echo "❌ Backup script not found: ${BACKUP_SCRIPT}"
    exit 1
fi

# Make backup script executable
chmod +x "${BACKUP_SCRIPT}"

echo "✅ Backup script is executable"

# Create the cron job entry
CRON_ENTRY="0 2 */3 * * cd ${CURRENT_DIR} && ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1"

echo "📅 Cron Job Entry:"
echo "${CRON_ENTRY}"
echo ""

# Add to crontab
echo "⏰ Adding cron job for every 3 days at 2:00 AM..."

# Get current crontab
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")

# Check if backup cron job already exists
if echo "${CURRENT_CRONTAB}" | grep -q "automated-backup.sh"; then
    echo "⚠️  Backup cron job already exists"
    echo "🔄 Updating existing cron job..."
    
    # Remove existing backup cron job
    echo "${CURRENT_CRONTAB}" | grep -v "automated-backup.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "${CRON_ENTRY}") | crontab -

echo "✅ Cron job added successfully"

# Create backup monitoring script
cat > monitor-automated-backups.sh << 'EOF'
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
EOF

chmod +x monitor-automated-backups.sh

# Create backup configuration
cat > automated-backup-config.json << 'EOF'
{
  "backup": {
    "enabled": true,
    "schedule": "every 3 days",
    "time": "2:00 AM",
    "retention_days": 21,
    "compression": true,
    "encryption": false
  },
  "monitoring": {
    "enabled": true,
    "log_file": "automated-backups/backup.log",
    "alert_threshold_days": 4
  },
  "directories": {
    "backup_dir": "automated-backups/",
    "source_dir": "./",
    "exclude": ["node_modules", ".git", ".vite", "dist", "backups"]
  }
}
EOF

echo ""
echo "📊 Automated Backup Setup Summary"
echo "================================="
echo "✅ Backup script: automated-backup.sh"
echo "✅ Cron job: Every 3 days at 2:00 AM"
echo "✅ Monitoring: monitor-automated-backups.sh"
echo "✅ Configuration: automated-backup-config.json"
echo "✅ Log file: ${LOG_FILE}"
echo ""
echo "🚀 Next Steps:"
echo "1. Test backup: ./automated-backup.sh"
echo "2. Monitor status: ./monitor-automated-backups.sh"
echo "3. Check cron job: crontab -l"
echo "4. View logs: tail -f ${LOG_FILE}"
echo ""
echo "⏰ Backup Schedule:"
echo "- Frequency: Every 3 days"
echo "- Time: 2:00 AM"
echo "- Retention: 21 days"
echo "- Location: automated-backups/"
echo ""
echo "✅ Automated backup setup completed!"
