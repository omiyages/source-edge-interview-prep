# 🔐 Secrets Management Guide

## Overview
This guide covers the secure management of sensitive data, API keys, and environment variables in your application.

## 🚨 Security Principles

### ✅ Do's
- Use environment variables for all sensitive data
- Validate all environment variables at startup
- Use a secrets management service in production
- Rotate secrets regularly
- Monitor for exposed secrets in logs
- Use different secrets for different environments

### ❌ Don'ts
- Never hardcode secrets in source code
- Never commit secrets to version control
- Never log sensitive information
- Never expose secrets in error messages
- Never use the same secrets across environments

## 🔧 Configuration

### Environment Variables Setup

#### 1. Development Environment
Create a `.env.local` file in your project root:

```bash
# Copy the template
cp env.template .env.local

# Edit with your actual values
nano .env.local
```

#### 2. Production Environment
Set environment variables in your deployment platform:

**Vercel:**
```bash
# Set via Vercel CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GOOGLE_CLIENT_ID
vercel env add VITE_GOOGLE_CLIENT_SECRET
```

**GitHub Actions:**
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
  VITE_GOOGLE_CLIENT_SECRET: ${{ secrets.VITE_GOOGLE_CLIENT_SECRET }}
```

## 📋 Required Environment Variables

### Core Configuration
```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/oauth2callback
VITE_GOOGLE_SHEET_ID=your_google_sheet_id
```

### Security Configuration
```bash
# Security Features
VITE_SECURITY_HEADERS_ENABLED=true
VITE_RATE_LIMITING_ENABLED=true
VITE_DEBUG_MODE=false

# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com
VITE_API_TIMEOUT=30000

# Monitoring
VITE_MONITORING_ENABLED=true
VITE_ANALYTICS_ID=your_analytics_id
```

### Feature Flags
```bash
# Feature Toggles
VITE_FEATURE_KANBAN_ENABLED=true
VITE_FEATURE_BULK_ADD_ENABLED=true
VITE_FEATURE_SECURITY_MONITORING=true
```

## 🛡️ Security Features

### Environment Validation
The application automatically validates all environment variables at startup:

```typescript
// Automatic validation
const validation = environment.validateSecrets();
if (!validation.isValid) {
  console.error('Environment validation failed:', validation.errors);
}
```

### Secrets Management
Centralized secrets management with validation:

```typescript
import { secretsManager } from '@/utils/secretsManager';

// Validate all secrets
const report = secretsManager.generateSecurityReport();
console.log('Risk Level:', report.riskLevel);
```

### Secure Configuration
All sensitive data is handled through the environment manager:

```typescript
import { environment } from '@/config/environment';

// Secure access to configuration
const supabaseConfig = environment.supabase;
const googleConfig = environment.google;
```

## 🔍 Validation & Testing

### Automated Validation
The application includes automated secrets validation:

```bash
# Validate environment configuration
npm run secrets:validate

# Check for hardcoded secrets
npm run secrets:scan

# Generate security report
npm run secrets:report
```

### Manual Testing
```bash
# Test environment configuration
node -e "
import('./src/config/environment.js').then(env => {
  const validation = env.environment.validateSecrets();
  console.log('Validation result:', validation);
});
"
```

## 🚀 Deployment

### Vercel Deployment
1. Set environment variables in Vercel dashboard
2. Deploy with `vercel --prod`
3. Verify configuration with `npm run secrets:validate`

### Self-Hosting
1. Set environment variables on your server
2. Use a secrets management service (e.g., HashiCorp Vault)
3. Validate configuration before starting the application

## 📊 Monitoring

### Security Monitoring
The application includes built-in security monitoring:

- **Secret Validation**: Automatic validation of all secrets
- **Hardcoded Secret Detection**: Scans for accidentally committed secrets
- **Environment Validation**: Ensures all required variables are set
- **Security Reporting**: Generates comprehensive security reports

### Risk Assessment
The system automatically assesses security risk levels:

- **LOW**: All secrets properly configured
- **MEDIUM**: Minor configuration issues
- **HIGH**: Multiple security warnings
- **CRITICAL**: Validation errors that prevent secure operation

## 🔧 Troubleshooting

### Common Issues

#### 1. Missing Environment Variables
**Error**: `Required environment variable VITE_SUPABASE_URL is not set`
**Solution**: Set the environment variable in your `.env.local` file or deployment platform

#### 2. Invalid Configuration
**Error**: `Environment validation failed`
**Solution**: Check that all required variables are set and valid

#### 3. Hardcoded Secrets
**Error**: `Found potential hardcoded secrets`
**Solution**: Remove hardcoded values and use environment variables

### Debug Mode
Enable debug mode for detailed logging:

```bash
VITE_DEBUG_MODE=true npm run dev
```

## 📚 Best Practices

### 1. Environment Separation
- Use different secrets for development, staging, and production
- Never use production secrets in development
- Use placeholder values in development

### 2. Secret Rotation
- Rotate secrets regularly (every 90 days)
- Update all environments when rotating secrets
- Monitor for failed authentications after rotation

### 3. Access Control
- Limit access to production secrets
- Use role-based access control
- Audit secret access regularly

### 4. Monitoring
- Monitor for exposed secrets in logs
- Set up alerts for security violations
- Regular security audits

## 🆘 Emergency Procedures

### Secret Compromise
If a secret is compromised:

1. **Immediately rotate the compromised secret**
2. **Update all environments**
3. **Review access logs**
4. **Update dependent services**
5. **Notify security team**

### Configuration Issues
If configuration validation fails:

1. **Check environment variables**
2. **Verify secret values**
3. **Check for typos**
4. **Validate secret format**
5. **Contact support if needed**

## 📞 Support

For security-related issues:
- Check the troubleshooting section
- Review the security report
- Contact the security team
- Follow emergency procedures if needed

---

**Remember**: Security is everyone's responsibility. Always follow security best practices and report any security concerns immediately.
