# Fix CSP Blocking Courses/Tracks Functionality

## Problem
Users report that courses/tracks functionality is blocked by Content-Security-Policy (CSP) with the error: "Content-Security-Policy blocked."

## Root Cause Analysis

### 1. CSP Policy Inconsistency
- `vercel.json` has `'unsafe-inline'` for `script-src`
- `public/_headers` was missing `'unsafe-inline'` for `script-src`
- This inconsistency causes CSP blocking in production

### 2. Common CSP Issues with React Apps
- Inline event handlers blocked
- Dynamic script execution blocked
- External resource loading blocked
- WebSocket connections blocked

### 3. Potential Blocked Resources
- Supabase real-time connections
- React Router navigation
- Dynamic imports
- Inline styles and scripts

## Solution Applied

### 1. Fixed CSP Policy Consistency
**File**: `public/_headers`
**Change**: Added `'unsafe-inline'` to `script-src`
```diff
- script-src 'self' 'unsafe-eval'
+ script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

### 2. Enhanced CSP for React Applications
**File**: `vercel.json`
**Enhanced CSP Policy**:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.mapbox.com wss://*.supabase.co; img-src 'self' https://*.supabase.co data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; font-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests; object-src 'none';"
}
```

## Additional CSP Enhancements

### 1. WebSocket Support
Added `wss://*.supabase.co` to `connect-src` for real-time features

### 2. Font Loading
Added `data:` to `font-src` for base64 encoded fonts

### 3. Object Security
Added `object-src 'none'` to prevent object/embed/applet execution

### 4. Development vs Production
- Development: More permissive CSP
- Production: Secure but functional CSP

## Testing the Fix

### 1. Local Testing
```bash
# Test CSP headers locally
curl -I http://localhost:8080/track
curl -I http://localhost:8080/courses
```

### 2. Production Testing
```bash
# Test CSP headers in production
curl -I https://your-domain.com/track
curl -I https://your-domain.com/courses
```

### 3. Browser Console
Check for CSP violations in browser console:
```javascript
// Monitor CSP violations
document.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', e);
});
```

## Common CSP Violations to Watch For

### 1. Inline Scripts
```html
<!-- This will be blocked -->
<button onclick="doSomething()">Click me</button>

<!-- Use this instead -->
<button onClick={handleClick}>Click me</button>
```

### 2. Inline Styles
```html
<!-- This will be blocked -->
<div style="color: red;">Text</div>

<!-- Use this instead -->
<div className="text-red-500">Text</div>
```

### 3. External Resources
```javascript
// This might be blocked
const script = document.createElement('script');
script.src = 'https://external-site.com/script.js';

// Use dynamic imports instead
const module = await import('./module.js');
```

## Debugging CSP Issues

### 1. Browser Developer Tools
- Open DevTools → Console
- Look for CSP violation messages
- Check Network tab for blocked requests

### 2. CSP Report-Only Mode
Add CSP report-only header for testing:
```json
{
  "key": "Content-Security-Policy-Report-Only",
  "value": "default-src 'self'; report-uri /csp-report"
}
```

### 3. CSP Violation Reporting
```javascript
// Report CSP violations
document.addEventListener('securitypolicyviolation', (e) => {
  fetch('/csp-report', {
    method: 'POST',
    body: JSON.stringify({
      violatedDirective: e.violatedDirective,
      blockedURI: e.blockedURI,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber
    })
  });
});
```

## Files Modified

1. **`public/_headers`**
   - Added `'unsafe-inline'` to `script-src`
   - Ensures consistency with `vercel.json`

2. **`vercel.json`** (if needed)
   - Enhanced CSP policy for React applications
   - Added WebSocket support
   - Added font data URI support

## Verification Steps

1. **Deploy the changes**
2. **Test courses/tracks functionality**
3. **Check browser console for CSP violations**
4. **Verify all features work correctly**

## Expected Results

- ✅ Courses/tracks functionality works without CSP blocking
- ✅ No CSP violation errors in browser console
- ✅ All React Router navigation works
- ✅ Supabase real-time features work
- ✅ Dynamic imports work correctly

## Additional Recommendations

### 1. CSP Monitoring
Set up CSP violation reporting to monitor issues in production

### 2. Gradual CSP Tightening
Start with permissive CSP and gradually tighten it

### 3. CSP Testing
Test CSP changes in staging environment first

### 4. Documentation
Document any CSP exceptions and their reasons
