-- Fix security vulnerability in candidates table RLS policy
-- Replace overly permissive policy with secure access control

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;

-- Create a more secure policy that only allows:
-- 1. Admins to view all candidates
-- 2. Users to view only their own candidate record (if they have one)
CREATE POLICY "Secure candidate access" 
ON public.candidates 
FOR SELECT 
USING (
  -- Admins can see all candidates
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Users can only see their own candidate record
  (auth.uid() = user_id)
);

-- Add additional policy to ensure users can only update their own candidate data
DROP POLICY IF EXISTS "Users can update their own candidate data" ON public.candidates;
CREATE POLICY "Users can update their own candidate data"
ON public.candidates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure users can only insert candidate data for themselves
DROP POLICY IF EXISTS "Users can create their own candidate record" ON public.candidates;
CREATE POLICY "Users can create their own candidate record"
ON public.candidates
FOR INSERT
WITH CHECK (auth.uid() = user_id);