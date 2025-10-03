-- Optimize RLS policies to prevent recursive calls and improve performance

-- Create optimized functions for role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies to use the optimized functions and prevent warnings

-- Drop and recreate policies for interview_questions
DROP POLICY IF EXISTS "Users can view approved questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Public can view approved questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.interview_questions;
DROP POLICY IF EXISTS "Authenticated users can submit questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Admins can update all questions" ON public.interview_questions;

CREATE POLICY "Users can view approved questions" ON public.interview_questions
FOR SELECT USING (
  status = 'approved' OR 
  public.has_role(auth.uid(), 'admin') OR 
  auth.uid() = (SELECT id FROM public.profiles WHERE email = interview_questions.submitted_by)
);

CREATE POLICY "Authenticated users can submit questions" ON public.interview_questions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all questions" ON public.interview_questions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own submissions" ON public.interview_questions
FOR UPDATE USING (
  submitted_by = auth.email() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Optimize profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Optimize other table policies
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;
CREATE POLICY "Admins can view all progress" ON public.user_progress
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage hiring stages" ON public.hiring_stages;
CREATE POLICY "Admins can manage hiring stages" ON public.hiring_stages
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage course stages" ON public.course_stages;
CREATE POLICY "Admins can manage course stages" ON public.course_stages
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources" ON public.resources
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage course assignments" ON public.course_assignments;
CREATE POLICY "Admins can manage course assignments" ON public.course_assignments
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage stage questions" ON public.stage_questions;
CREATE POLICY "Admins can manage stage questions" ON public.stage_questions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage stage resources" ON public.stage_resources;
CREATE POLICY "Admins can manage stage resources" ON public.stage_resources
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage candidate pipeline" ON public.candidate_pipeline;
CREATE POLICY "Admins can manage candidate pipeline" ON public.candidate_pipeline
FOR ALL USING (public.has_role(auth.uid(), 'admin'));