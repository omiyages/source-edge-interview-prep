
-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure the profiles table has the correct structure
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Update any existing profiles that might have NULL roles
UPDATE public.profiles 
SET role = 'user'::app_role 
WHERE role IS NULL;
