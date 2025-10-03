# Security Implementation Plan

## 1. HTTPS Everywhere Implementation

### Current Status: ⚠️ PARTIAL
- Basic security headers configured
- Vercel deployment with HTTPS
- Need production SSL hardening

### Implementation Steps:

#### A. Enhanced SSL/TLS Configuration
```typescript
// vercel.json - Enhanced security headers
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' https://*.supabase.co data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; font-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://$host$1",
      "permanent": true,
      "has": [
        {
          "type": "header",
          "key": "x-forwarded-proto",
          "value": "http"
        }
      ]
    }
  ]
}
```

#### B. Nginx Configuration (if self-hosting)
```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## 2. Secrets Management Implementation

### Current Status: ⚠️ NEEDS IMPROVEMENT
- Some hardcoded values in client.ts
- Environment variables partially implemented
- Need centralized secrets management

### Implementation Steps:

#### A. Environment Variables Setup
```bash
# .env.local (for development)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=your_redirect_uri
VITE_GOOGLE_SHEET_ID=your_sheet_id
```

#### B. GitHub Actions Secrets (for production)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

#### C. Enhanced Client Configuration
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## 3. Dependency Scanning Implementation

### Current Status: ❌ NOT IMPLEMENTED
- No automated vulnerability scanning
- Manual dependency management only

### Implementation Steps:

#### A. Dependabot Configuration
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-username"
    assignees:
      - "your-username"
    commit-message:
      prefix: "security"
      include: "scope"
```

#### B. Snyk Integration
```json
// package.json - Add Snyk scripts
{
  "scripts": {
    "security:audit": "npm audit",
    "security:check": "snyk test",
    "security:monitor": "snyk monitor"
  },
  "devDependencies": {
    "snyk": "^1.1248.0"
  }
}
```

#### C. GitHub Actions Security Workflow
```yaml
# .github/workflows/security.yml
name: Security Scan
on:
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday at 2 AM
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - name: Run npm audit
        run: npm audit --audit-level moderate
```

## 4. Enhanced Authentication & Authorization

### Current Status: ✅ STRONG
- Supabase Auth with RBAC
- Role-based access control
- Session management

### Additional Enhancements:

#### A. Password Policy Enforcement
```typescript
// src/utils/passwordPolicy.ts
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

#### B. Session Security
```typescript
// src/hooks/useSessionSecurity.ts
export const useSessionSecurity = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Check for session timeout
      const checkSession = () => {
        const lastActivity = localStorage.getItem('lastActivity');
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes
        
        if (lastActivity && now - parseInt(lastActivity) > timeout) {
          // Session expired, sign out
          supabase.auth.signOut();
        }
      };
      
      // Update last activity on user interaction
      const updateActivity = () => {
        localStorage.setItem('lastActivity', Date.now().toString());
      };
      
      // Set up activity tracking
      document.addEventListener('click', updateActivity);
      document.addEventListener('keypress', updateActivity);
      
      // Check session every minute
      const interval = setInterval(checkSession, 60000);
      
      return () => {
        document.removeEventListener('click', updateActivity);
        document.removeEventListener('keypress', updateActivity);
        clearInterval(interval);
      };
    }
  }, [user]);
};
```

## 5. Enhanced Input Validation

### Current Status: ✅ STRONG
- Multiple validation layers
- XSS protection
- SQL injection prevention

### Additional Enhancements:

#### A. File Upload Security
```typescript
// src/utils/fileSecurity.ts
export const validateFileUpload = (file: File): ValidationResult => {
  const errors: string[] = [];
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size must be less than 5MB');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push('File extension not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

#### B. Enhanced SQL Injection Prevention
```typescript
// src/utils/sqlSecurity.ts
export const sanitizeSQLInput = (input: string): string => {
  // Remove SQL injection patterns
  return input
    .replace(/[';--]/g, '') // Remove quotes, semicolons, comments
    .replace(/\b(union|select|insert|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .trim();
};
```

## 6. Rate Limiting & Throttling

### Current Status: ⚠️ PARTIAL
- Database-level rate limiting implemented
- Frontend rate limiting needs enhancement

### Implementation Steps:

#### A. Frontend Rate Limiting
```typescript
// src/hooks/useRateLimit.ts
export const useRateLimit = (maxRequests: number = 10, windowMs: number = 60000) => {
  const [requests, setRequests] = useState<number[]>([]);
  
  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    setRequests([...recentRequests, now]);
    return true;
  }, [requests, maxRequests, windowMs]);
  
  return { canMakeRequest };
};
```

#### B. API Rate Limiting Middleware
```typescript
// src/utils/rateLimiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
```

## 7. Enhanced Audit Logging

### Current Status: ✅ STRONG
- Security event logging implemented
- Database audit trails

### Additional Enhancements:

#### A. Enhanced Security Monitoring
```typescript
// src/utils/securityMonitor.ts
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  
  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }
  
  logSecurityEvent(event: SecurityEvent): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Security Event:', event);
    }
    
    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoringService(event);
    }
  }
  
  private sendToMonitoringService(event: SecurityEvent): void {
    // Implementation for production monitoring
    fetch('/api/security-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  }
}
```

#### B. Real-time Security Alerts
```typescript
// src/components/SecurityAlerts.tsx
export const SecurityAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel('security-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_audit_log'
      }, (payload) => {
        if (payload.new.severity === 'high') {
          setAlerts(prev => [...prev, payload.new]);
        }
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <div className="security-alerts">
      {alerts.map(alert => (
        <Alert key={alert.id} variant="destructive">
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
```

## Implementation Priority

### Phase 1 (Immediate - Week 1)
1. ✅ HTTPS configuration enhancement
2. ✅ Secrets management setup
3. ✅ Dependabot configuration

### Phase 2 (Short-term - Week 2-3)
1. ✅ Snyk integration
2. ✅ Enhanced rate limiting
3. ✅ Security monitoring improvements

### Phase 3 (Medium-term - Month 1)
1. ✅ Advanced audit logging
2. ✅ Real-time security alerts
3. ✅ Security testing automation

### Phase 4 (Long-term - Ongoing)
1. ✅ Regular security audits
2. ✅ Penetration testing
3. ✅ Security training for team

## Security Checklist

- [ ] HTTPS everywhere with HSTS
- [ ] Secrets in environment variables
- [ ] Dependabot configured
- [ ] Snyk integration
- [ ] Enhanced authentication
- [ ] Input validation strengthened
- [ ] Rate limiting implemented
- [ ] Audit logging enhanced
- [ ] Security monitoring active
- [ ] Regular security reviews

## Next Steps

1. **Immediate**: Implement HTTPS enhancements and secrets management
2. **This Week**: Set up dependency scanning with Dependabot
3. **Next Week**: Integrate Snyk for vulnerability scanning
4. **Ongoing**: Monitor and maintain security posture

This comprehensive plan addresses all the security requirements you mentioned while building on your existing strong security foundation.
