-- Allow users to self-assign courses
-- This enables the "Start Course" functionality where users can enroll themselves

-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can self-assign courses" ON public.course_assignments;

-- Create policy for users to insert their own course assignments
CREATE POLICY "Users can self-assign courses" 
ON public.course_assignments 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  auth.uid() = assigned_by
);

