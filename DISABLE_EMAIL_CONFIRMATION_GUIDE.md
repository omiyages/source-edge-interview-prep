# Disable Email Confirmation in Supabase

## Problem
Users are getting "email not confirmed" errors when trying to sign in, but we don't want to require email confirmation since we're using proxy emails.

## Solution
Disable email confirmation in Supabase through both database changes and dashboard settings.

## Steps to Fix

### 1. Run SQL Script
Execute the `disable_email_confirmation.sql` script in Supabase SQL Editor:

```sql
-- Update existing users to be email confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Create auto-confirmation trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Update Supabase Dashboard Settings

1. **Go to Supabase Dashboard** → Your Project → Authentication → Settings
2. **Find "Email Confirmation"** section
3. **Disable "Enable email confirmations"**
4. **Save changes**

### 3. Alternative: Update Auth Settings via SQL

If you can't access the dashboard, you can also update the auth settings via SQL:

```sql
-- Update auth configuration to disable email confirmation
UPDATE auth.config 
SET enable_email_confirmations = false
WHERE id = 1;
```

### 4. Verify the Changes

Check that existing users are now email confirmed:

```sql
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;
```

## Expected Result

After implementing these changes:
- ✅ Existing users can sign in without email confirmation
- ✅ New users are automatically email confirmed
- ✅ No more "email not confirmed" errors
- ✅ Authentication works seamlessly with proxy emails

## Troubleshooting

If users still get confirmation errors:
1. Check that the SQL script ran successfully
2. Verify dashboard settings are updated
3. Clear browser cache and try again
4. Check Supabase logs for any errors

## Security Note

This approach is suitable for:
- Development environments
- Internal applications
- Systems using proxy/placeholder emails

For production with real user emails, consider keeping email confirmation enabled for security.
