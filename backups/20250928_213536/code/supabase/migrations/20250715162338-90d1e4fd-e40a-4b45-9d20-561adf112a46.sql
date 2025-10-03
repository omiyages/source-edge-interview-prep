-- Comprehensive fix for all anonymous access policy warnings
-- This ensures all policies explicitly require authentication where needed

-- First, let's disable anonymous sign-ins by requiring authentication for all user data
-- Keep only essential public read access for courses/resources

-- 1. Fix candidate_pipeline - all policies should require authentication
DROP POLICY IF EXISTS "Authenticated users can view their own pipeline status" ON public.candidate_pipeline;
CREATE POLICY "Authenticated users can view their own pipeline status" ON public.candidate_pipeline
FOR SELECT TO authenticated USING (
  candidate_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- 2. Fix course_assignments - all policies should require authentication  
DROP POLICY IF EXISTS "Authenticated users can view their assigned courses" ON public.course_assignments;
CREATE POLICY "Authenticated users can view their assigned courses" ON public.course_assignments
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Fix interview_questions - ensure no anonymous access
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.interview_questions;
CREATE POLICY "Authenticated users can update their own submissions" ON public.interview_questions
FOR UPDATE TO authenticated USING (
  submitted_by = auth.email() OR 
  public.has_role(auth.uid(), 'admin')
);

-- 4. Remove public access from courses if not needed for your app
-- If your app needs public course viewing, keep this policy
-- If not, comment out or remove this policy
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
CREATE POLICY "Authenticated users can view courses" ON public.courses
FOR SELECT TO authenticated USING (true);

-- 5. Remove public access from course_stages if not needed
DROP POLICY IF EXISTS "Public can view course stages" ON public.course_stages;
CREATE POLICY "Authenticated users can view course stages" ON public.course_stages
FOR SELECT TO authenticated USING (true);

-- 6. Remove public access from hiring_stages if not needed
DROP POLICY IF EXISTS "Everyone can view hiring stages" ON public.hiring_stages;
CREATE POLICY "Authenticated users can view hiring stages" ON public.hiring_stages
FOR SELECT TO authenticated USING (true);

-- 7. Remove public access from resources if not needed
DROP POLICY IF EXISTS "Everyone can view resources" ON public.resources;
CREATE POLICY "Authenticated users can view resources" ON public.resources
FOR SELECT TO authenticated USING (true);

-- 8. Remove public access from stage_questions if not needed
DROP POLICY IF EXISTS "Public can view stage questions" ON public.stage_questions;
CREATE POLICY "Authenticated users can view stage questions" ON public.stage_questions
FOR SELECT TO authenticated USING (true);

-- 9. Remove public access from stage_resources if not needed
DROP POLICY IF EXISTS "Anyone can view stage resources" ON public.stage_resources;
CREATE POLICY "Authenticated users can view stage resources" ON public.stage_resources
FOR SELECT TO authenticated USING (true);

-- 10. Ensure all admin policies explicitly require authentication
-- (These should already be fixed from previous migration, but ensuring consistency)

-- 11. Clean up any remaining policies that might allow anonymous access
-- Remove any 'anon' role policies if they exist
DO $$
BEGIN
    -- This block will attempt to drop any policies that might be granting access to anon role
    -- Most of these probably don't exist, but this ensures cleanup
    
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for anon users" ON public.courses';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for anon users" ON public.course_stages';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for anon users" ON public.hiring_stages';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for anon users" ON public.resources';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for anon users" ON public.stage_questions';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for anon users" ON public.stage_resources';
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;