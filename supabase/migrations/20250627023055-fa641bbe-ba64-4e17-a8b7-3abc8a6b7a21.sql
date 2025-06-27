
-- Fix the infinite recursion issue in RLS policies
-- Create a security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Drop and recreate problematic profiles policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Fix resources policies
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;

CREATE POLICY "Admins can manage resources"
ON public.resources
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Fix interview questions policies
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.interview_questions;

CREATE POLICY "Admins can manage all questions" 
ON public.interview_questions 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update their own submissions"
ON public.interview_questions
FOR UPDATE
TO authenticated
USING (submitted_by = auth.email() OR public.get_current_user_role() = 'admin');

-- Fix courses and course_stages policies
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage course stages" ON public.course_stages;
DROP POLICY IF EXISTS "Admins can manage stage questions" ON public.stage_questions;

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage course stages"
ON public.course_stages
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage stage questions"
ON public.stage_questions
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin');
