-- Disable email confirmation in Supabase
-- Run this in Supabase SQL Editor

-- Update the auth.users table to mark all existing users as email confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Create a function to automatically confirm emails for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm email for new users
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm emails on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update Supabase configuration to disable email confirmation
-- Note: This requires updating the Supabase dashboard settings as well
-- Go to Authentication > Settings > Email Confirmation and disable it

-- Verify the changes
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
