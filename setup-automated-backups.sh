#!/bin/bash

# Automated Backup Setup Script
# Sets up automated backups for your website

set -e

echo "🤖 Setting up Automated Backups"
echo "==============================="
echo ""

# Create backup configuration
cat > backup-config.json << 'EOF'
{
  "backup": {
    "enabled": true,
    "schedule": "daily",
    "retention_days": 30,
    "compression": true,
    "encryption": false
  },
  "database": {
    "enabled": true,
    "schedule": "daily",
    "retention_days": 7,
    "tables": [
      "profiles",
      "user_stages",
      "stage_transitions",
      "admin_notes",
      "user_rejections",
      "dropdown_options",
      "interviews",
      "jobs",
      "user_jobs"
    ]
  },
  "storage": {
    "local": true,
    "cloud": false,
    "cloud_provider": "aws",
    "bucket": "your-backup-bucket"
  },
  "notifications": {
    "email": "your-email@example.com",
    "slack": false,
    "webhook": ""
  }
}
EOF

# Create cron job for daily backups
echo "⏰ Setting up daily backup cron job..."

# Create cron job script
cat > daily-backup.sh << 'EOF'
#!/bin/bash

# Daily Backup Cron Job
# Runs automatically to backup your website

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="backups/backup.log"

echo "$(date): Starting daily backup" >> "$LOG_FILE"

# Run website backup
./backup-website.sh >> "$LOG_FILE" 2>&1

# Run database backup
./backup-database.sh >> "$LOG_FILE" 2>&1

# Clean up old backups (keep last 30 days)
find backups -name "*.tar.gz" -mtime +30 -delete >> "$LOG_FILE" 2>&1

echo "$(date): Daily backup completed" >> "$LOG_FILE"
EOF

chmod +x daily-backup.sh

# Add to crontab
echo "📅 Adding cron job for daily backups at 2 AM..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./daily-backup.sh") | crontab -

# Create backup monitoring script
cat > monitor-backups.sh << 'EOF'
#!/bin/bash

# Backup Monitoring Script
# Monitors backup health and sends notifications

BACKUP_DIR="backups"
LOG_FILE="backups/backup.log"

echo "🔍 Checking backup health..."

# Check if backups exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ No backup directory found"
    exit 1
fi

# Check last backup date
LAST_BACKUP=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2)
if [ -z "$LAST_BACKUP" ]; then
    echo "❌ No backups found"
    exit 1
fi

# Check if backup is recent (within 24 hours)
BACKUP_AGE=$(( $(date +%s) - $(stat -c %Y "$LAST_BACKUP") ))
if [ $BACKUP_AGE -gt 86400 ]; then
    echo "⚠️  Last backup is older than 24 hours"
    exit 1
fi

echo "✅ Backup health check passed"
echo "📁 Last backup: $LAST_BACKUP"
echo "⏰ Backup age: $(( $BACKUP_AGE / 3600 )) hours"
EOF

chmod +x monitor-backups.sh

# Create backup restoration guide
cat > BACKUP_RESTORATION_GUIDE.md << 'EOF'
# Website Backup & Restoration Guide

## Overview
This guide explains how to backup and restore your source-edge-interview-prep website.

## Backup Types

### 1. Code Backup
- **Location**: `backups/YYYYMMDD_HHMMSS/code/`
- **Contains**: Source code, configuration files
- **Size**: ~50MB

### 2. Database Backup
- **Location**: `backups/YYYYMMDD_HHMMSS/database/`
- **Contains**: SQL dumps, schema, data
- **Size**: ~10MB

### 3. Assets Backup
- **Location**: `backups/YYYYMMDD_HHMMSS/assets/`
- **Contains**: Public files, images, static assets
- **Size**: ~5MB

## Restoration Procedures

### Full Website Restoration
1. Extract backup: `tar -xzf YYYYMMDD_HHMMSS_website_backup.tar.gz`
2. Restore code: `cp -r backups/YYYYMMDD_HHMMSS/code/* /path/to/restore/`
3. Restore database: Run scripts in `backups/YYYYMMDD_HHMMSS/database/`
4. Restore assets: `cp -r backups/YYYYMMDD_HHMMSS/assets/* /path/to/restore/`

### Database-Only Restoration
1. Install Supabase CLI: `npm install -g supabase`
2. Run: `./backups/YYYYMMDD_HHMMSS/database/restore-database.sh`
3. Or manually restore individual SQL files

### Code-Only Restoration
1. Extract backup: `tar -xzf YYYYMMDD_HHMMSS_website_backup.tar.gz`
2. Copy code: `cp -r backups/YYYYMMDD_HHMMSS/code/* /path/to/restore/`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`

## Automated Backups

### Daily Backup Schedule
- **Time**: 2:00 AM daily
- **Retention**: 30 days
- **Location**: `backups/` directory
- **Logs**: `backups/backup.log`

### Monitoring
- Run `./monitor-backups.sh` to check backup health
- Check logs: `tail -f backups/backup.log`

## Security Considerations

### Environment Variables
- Never backup `.env.local` with production secrets
- Use separate backup for sensitive configuration
- Rotate secrets regularly

### Database Security
- Encrypt database backups if containing sensitive data
- Store backups securely
- Test restoration procedures

## Troubleshooting

### Backup Failures
1. Check disk space: `df -h`
2. Check permissions: `ls -la backups/`
3. Check logs: `tail -f backups/backup.log`

### Restoration Issues
1. Verify backup integrity: `tar -tzf backup.tar.gz`
2. Check file permissions: `ls -la`
3. Verify database connection

## Best Practices

1. **Test Backups**: Regularly test restoration procedures
2. **Multiple Locations**: Store backups in multiple locations
3. **Encryption**: Encrypt sensitive backups
4. **Monitoring**: Set up backup monitoring and alerts
5. **Documentation**: Keep restoration procedures documented

## Emergency Contacts

- **GitHub Repository**: https://github.com/omiyages/source-edge-interview-prep
- **Supabase Dashboard**: Your Supabase project dashboard
- **Backup Location**: Local `backups/` directory
EOF

echo ""
echo "📊 Automated Backup Setup Summary"
echo "=================================="
echo "✅ Backup configuration created: backup-config.json"
echo "✅ Daily backup cron job scheduled for 2:00 AM"
echo "✅ Backup monitoring script created: monitor-backups.sh"
echo "✅ Restoration guide created: BACKUP_RESTORATION_GUIDE.md"
echo ""
echo "🚀 Next Steps:"
echo "1. Review backup-config.json and update settings"
echo "2. Test the backup system: ./backup-website.sh"
echo "3. Monitor backup health: ./monitor-backups.sh"
echo "4. Read the restoration guide: BACKUP_RESTORATION_GUIDE.md"
echo ""
echo "✅ Automated backup setup completed!"
