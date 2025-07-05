
-- Ensure the app_role enum exists
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Make sure the profiles table uses the enum properly
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Set a proper default
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user'::public.app_role;

-- Ensure the function exists and works properly
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;
