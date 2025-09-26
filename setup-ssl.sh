#!/bin/bash

# SSL Certificate Setup Script
# This script sets up Let's Encrypt SSL certificates with security hardening

set -e

# Configuration
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"
WEBROOT="/var/www/html"

echo "🔒 Setting up SSL certificates for $DOMAIN"

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Certbot
echo "🔧 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
echo "⏸️ Stopping nginx..."
sudo systemctl stop nginx

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate..."
sudo certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# Set up automatic renewal
echo "🔄 Setting up automatic renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test certificate renewal
echo "🧪 Testing certificate renewal..."
sudo certbot renew --dry-run

# Configure nginx with SSL
echo "⚙️ Configuring nginx with SSL..."
sudo cp nginx-https.conf /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
sudo nginx -t

# Start nginx
echo "🚀 Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Set up SSL monitoring
echo "📊 Setting up SSL monitoring..."
cat > ssl-monitor.sh << 'EOF'
#!/bin/bash
# SSL Certificate Monitoring Script

DOMAIN="yourdomain.com"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
LOG_FILE="/var/log/ssl-monitor.log"

# Check certificate expiry
check_cert_expiry() {
    if [ -f "$CERT_PATH" ]; then
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
        
        echo "$(date): Certificate expires in $DAYS_UNTIL_EXPIRY days" >> "$LOG_FILE"
        
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            echo "$(date): WARNING: Certificate expires in $DAYS_UNTIL_EXPIRY days" >> "$LOG_FILE"
            # Send notification (customize as needed)
            # curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
            #      -H 'Content-type: application/json' \
            #      --data '{"text":"SSL Certificate expires in '$DAYS_UNTIL_EXPIRY' days for '$DOMAIN'"}'
        fi
    fi
}

# Check SSL grade
check_ssl_grade() {
    GRADE=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN" | jq -r '.endpoints[0].grade' 2>/dev/null || echo "Unknown")
    echo "$(date): SSL Grade: $GRADE" >> "$LOG_FILE"
}

# Run checks
check_cert_expiry
check_ssl_grade
EOF

chmod +x ssl-monitor.sh
sudo mv ssl-monitor.sh /usr/local/bin/
sudo chown root:root /usr/local/bin/ssl-monitor.sh

# Add to crontab for daily monitoring
echo "⏰ Adding SSL monitoring to crontab..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/ssl-monitor.sh") | crontab -

echo "✅ SSL setup complete!"
echo "🔍 Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "📊 Monitoring: /var/log/ssl-monitor.log"
echo "🔄 Auto-renewal: Enabled"
echo ""
echo "Next steps:"
echo "1. Update your domain in nginx-https.conf"
echo "2. Test your SSL configuration: https://www.ssllabs.com/ssltest/"
echo "3. Monitor certificate expiry with: sudo /usr/local/bin/ssl-monitor.sh"
