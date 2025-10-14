# Fix Edge Function 400 Error Guide

## Problem
The `admin-user-management` Edge Function is returning a 400 error when creating users. This is due to a mismatch between the request data structure sent by the frontend and what the Edge Function expects.

## Root Cause
The frontend sends data in this structure:
```javascript
{
  body: {
    email: "user@example.com",
    fullName: "User Name",
    role: "user",
    customPassword: "password"
  }
}
```

But the Edge Function was expecting the data directly in the request body.

## Solution Applied
Updated the Edge Function to handle both data structures:

```typescript
// Handle both direct properties and nested body structure
const userData = requestData.body || requestData;
const { email, fullName, role = 'user', customPassword } = userData;
```

## Files Modified
- `supabase/functions/admin-user-management/index.ts` - Updated data extraction logic
- Added comprehensive logging for debugging

## Manual Deployment Steps

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Find `admin-user-management`
4. Click "Edit"
5. Replace the entire function code with the updated version
6. Click "Deploy"

### Option 2: Supabase CLI (if authenticated)
```bash
supabase functions deploy admin-user-management
```

### Option 3: Copy-Paste Deployment
1. Copy the entire content of `supabase/functions/admin-user-management/index.ts`
2. Go to Supabase Dashboard > Edge Functions
3. Edit the `admin-user-management` function
4. Replace all content with the updated code
5. Deploy

## Testing the Fix

### 1. Test Data Structure
```javascript
// This is what the frontend sends:
const requestData = {
  body: {
    email: "test@source-edge.com",
    fullName: "Test User", 
    role: "user",
    customPassword: "TestPassword123!"
  }
};

// The function now extracts it correctly:
const userData = requestData.body || requestData;
// userData = { email: "test@source-edge.com", fullName: "Test User", ... }
```

### 2. Expected Behavior
- ✅ Function should accept the request data
- ✅ Extract user data correctly
- ✅ Validate and sanitize inputs
- ✅ Create user successfully
- ✅ Return success response

### 3. Debug Logging
The updated function includes comprehensive logging:
- Request body content
- Parsed data structure
- User data extraction
- Validation steps
- Error details

## Verification Steps

1. **Deploy the updated function**
2. **Try creating a user** through the admin dashboard
3. **Check the function logs** in Supabase Dashboard > Edge Functions > Logs
4. **Verify the user is created** in the users table

## Expected Log Output
```
🚀 Secure admin user management function called - Method: POST
🔐 Auth header present: true
✅ User authenticated: admin@example.com
✅ Admin role verified
📄 Request body received, length: 150
📄 Request body content: {"body":{"email":"test@source-edge.com",...}}
📋 Parsed data keys: ["body"]
📋 Parsed data structure: {"body":{"email":"test@source-edge.com",...}}
📋 User data extracted: {"email":"test@source-edge.com",...}
📝 Creating user with enhanced security: {...}
👤 Creating new user...
✅ User created successfully with ID: xxx
👤 Creating profile record...
✅ Profile created successfully
🎉 Returning secure success response
```

## Troubleshooting

### If still getting 400 errors:
1. Check the function logs for specific error messages
2. Verify the request data structure matches expected format
3. Ensure all required fields are present (email, fullName, role)
4. Check if rate limiting is blocking the request

### If getting authentication errors:
1. Verify the user has admin role
2. Check if the session token is valid
3. Ensure the Authorization header is properly formatted

### If getting database errors:
1. Check if the profiles table exists
2. Verify RLS policies allow the operation
3. Ensure the user has proper permissions

## Files to Check
- `src/components/CreateUserForm.tsx` - Frontend request structure
- `supabase/functions/admin-user-management/index.ts` - Edge Function logic
- Supabase Dashboard > Edge Functions > Logs - Function execution logs

## Success Criteria
- ✅ No more 400 errors when creating users
- ✅ Users are created successfully in the database
- ✅ Profile records are created correctly
- ✅ Success response is returned to frontend
- ✅ Function logs show successful execution
