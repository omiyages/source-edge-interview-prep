-- Fix remaining anonymous access policy warnings by updating admin policies
-- to require authentication and consolidate duplicate policies

-- Update interview_questions - remove duplicate admin policy and ensure authentication
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.interview_questions;
CREATE POLICY "Admins can manage all questions" ON public.interview_questions
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles - remove duplicate admin policy and ensure authentication  
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update user_progress - remove duplicate admin policy and ensure authentication
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;
CREATE POLICY "Admins can view all progress" ON public.user_progress
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update question_likes - remove duplicate policies and clean up
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.question_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.question_likes;
DROP POLICY IF EXISTS "Authenticated users can like questions" ON public.question_likes;
DROP POLICY IF EXISTS "Authenticated users can manage their own likes" ON public.question_likes;
CREATE POLICY "Auth users can manage their own likes" ON public.question_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Update hiring_stages admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage hiring stages" ON public.hiring_stages;
CREATE POLICY "Admins can manage hiring stages" ON public.hiring_stages
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update course_stages admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage course stages" ON public.course_stages;
CREATE POLICY "Admins can manage course stages" ON public.course_stages
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Remove duplicate course_stages view policies
DROP POLICY IF EXISTS "Anyone can view course stages" ON public.course_stages;
DROP POLICY IF EXISTS "Everyone can view course stages" ON public.course_stages;

-- Update courses admin policy to require authentication  
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Remove duplicate courses view policies
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;

-- Update resources admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources" ON public.resources
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update stage_questions admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage stage questions" ON public.stage_questions;
CREATE POLICY "Admins can manage stage questions" ON public.stage_questions
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Remove duplicate stage_questions view policies
DROP POLICY IF EXISTS "Anyone can view stage questions" ON public.stage_questions;
DROP POLICY IF EXISTS "Everyone can view stage questions" ON public.stage_questions;

-- Update stage_resources admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage stage resources" ON public.stage_resources;
CREATE POLICY "Admins can manage stage resources" ON public.stage_resources
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update course_assignments admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage course assignments" ON public.course_assignments;
CREATE POLICY "Admins can manage course assignments" ON public.course_assignments
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update candidate_pipeline admin policy to require authentication
DROP POLICY IF EXISTS "Admins can manage candidate pipeline" ON public.candidate_pipeline;
CREATE POLICY "Admins can manage candidate pipeline" ON public.candidate_pipeline
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));