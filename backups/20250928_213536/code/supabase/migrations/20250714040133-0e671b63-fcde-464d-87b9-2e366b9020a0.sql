-- Fix function search path mutable warnings for security
-- All functions should have SECURITY DEFINER and SET search_path = '' for security

-- Fix update_hiring_stages_updated_at function
CREATE OR REPLACE FUNCTION public.update_hiring_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Update RLS policies to require authentication where appropriate
-- Replace anonymous access policies with authenticated-only policies

-- Update interview_questions policies to require authentication for viewing
DROP POLICY IF EXISTS "Users can view approved questions" ON public.interview_questions;
CREATE POLICY "Authenticated users can view approved questions" ON public.interview_questions
FOR SELECT TO authenticated USING (
  status = 'approved' OR 
  public.has_role(auth.uid(), 'admin') OR 
  auth.uid() = (SELECT id FROM public.profiles WHERE email = interview_questions.submitted_by)
);

-- Update profiles policies to require authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Authenticated users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid());

-- Update user_progress policies to require authentication
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can modify their progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Authenticated users can view their own progress" ON public.user_progress
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can modify their progress" ON public.user_progress
FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own progress" ON public.user_progress
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update user_sessions policies to require authentication
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
CREATE POLICY "Authenticated users can view their own sessions" ON public.user_sessions
FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can update their own sessions" ON public.user_sessions
FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert their own sessions" ON public.user_sessions
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Update course_assignments policies to require authentication
DROP POLICY IF EXISTS "Users can view their assigned courses" ON public.course_assignments;
CREATE POLICY "Authenticated users can view their assigned courses" ON public.course_assignments
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Update candidate_pipeline policies to require authentication
DROP POLICY IF EXISTS "Users can view their own pipeline status" ON public.candidate_pipeline;
CREATE POLICY "Authenticated users can view their own pipeline status" ON public.candidate_pipeline
FOR SELECT TO authenticated USING (
  candidate_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Update question_likes policies to require authentication for viewing
DROP POLICY IF EXISTS "Anyone can view likes" ON public.question_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON public.question_likes;
CREATE POLICY "Authenticated users can view likes" ON public.question_likes
FOR SELECT TO authenticated USING (true);

-- Keep public access for read-only data that should be publicly accessible
-- (courses, course_stages, hiring_stages, resources, stage_questions, stage_resources)
-- These tables likely need public access for the application to function properly