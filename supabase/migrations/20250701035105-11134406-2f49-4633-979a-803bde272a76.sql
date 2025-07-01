
-- Drop ALL policies that depend on the role column (including INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage stage resources" ON public.stage_resources;
DROP POLICY IF EXISTS "Admins can manage stage questions" ON public.stage_questions;
DROP POLICY IF EXISTS "Admins can manage course stages" ON public.course_stages;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Drop specific operation policies that might exist
DROP POLICY IF EXISTS "Admins can insert stage questions" ON public.stage_questions;
DROP POLICY IF EXISTS "Admins can update stage questions" ON public.stage_questions;
DROP POLICY IF EXISTS "Admins can delete stage questions" ON public.stage_questions;
DROP POLICY IF EXISTS "Admins can insert stage resources" ON public.stage_resources;
DROP POLICY IF EXISTS "Admins can update stage resources" ON public.stage_resources;
DROP POLICY IF EXISTS "Admins can delete stage resources" ON public.stage_resources;
DROP POLICY IF EXISTS "Admins can insert course stages" ON public.course_stages;
DROP POLICY IF EXISTS "Admins can update course stages" ON public.course_stages;
DROP POLICY IF EXISTS "Admins can delete course stages" ON public.course_stages;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;

-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the profiles table to use the enum type properly
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE app_role USING role::app_role;

-- Set default value for the role column
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Recreate the policies using the enum type
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_current_user_role()::app_role = 'admin'::app_role);

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (public.get_current_user_role()::app_role = 'admin'::app_role);

CREATE POLICY "Admins can manage course stages" ON public.course_stages
  FOR ALL USING (public.get_current_user_role()::app_role = 'admin'::app_role);

CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL USING (public.get_current_user_role()::app_role = 'admin'::app_role);

CREATE POLICY "Admins can manage stage questions" ON public.stage_questions
  FOR ALL USING (public.get_current_user_role()::app_role = 'admin'::app_role);

CREATE POLICY "Admins can manage stage resources" ON public.stage_resources
  FOR ALL USING (public.get_current_user_role()::app_role = 'admin'::app_role);
