
-- Fix Row Level Security policies with proper IF NOT EXISTS checks
-- Drop and recreate interview_questions policies
DROP POLICY IF EXISTS "Everyone can view approved questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Authenticated users can submit questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Anyone can view interview questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Anyone can submit interview questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Public can view approved questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.interview_questions;

-- Create comprehensive RLS policies for interview_questions
CREATE POLICY "Public can view approved questions" 
ON public.interview_questions 
FOR SELECT 
USING (status = 'approved' OR status IS NULL);

CREATE POLICY "Authenticated users can submit questions" 
ON public.interview_questions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own submissions"
ON public.interview_questions
FOR UPDATE
TO authenticated
USING (submitted_by = auth.email() OR 
       EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can manage all questions" 
ON public.interview_questions 
FOR ALL 
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Fix profiles table RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create new profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Fix resources table RLS policies  
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins can create resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins can update resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins can delete resources" ON public.resources;
DROP POLICY IF EXISTS "Everyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;

CREATE POLICY "Everyone can view resources"
ON public.resources
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage resources"
ON public.resources
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Fix user_sessions table RLS policies
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Fix question_likes table RLS
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all likes" ON public.question_likes;
DROP POLICY IF EXISTS "Authenticated users can like questions" ON public.question_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.question_likes;

CREATE POLICY "Users can view all likes"
ON public.question_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like questions"
ON public.question_likes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own likes"
ON public.question_likes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_interview_questions_status ON public.interview_questions(status);
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON public.interview_questions(company);
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON public.interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_likes_user_question ON public.question_likes(user_id, question_id);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    'user'::app_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
