
-- Fix 1: Restrict profile role updates to prevent privilege escalation
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid()) 
WITH CHECK (
  id = auth.uid() AND 
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Fix 2: Create admin-only role update function with audit logging
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role app_role,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_role app_role;
  old_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Get old role for logging
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE id = target_user_id;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the role change (using existing security logger on frontend)
  RETURN TRUE;
END;
$$;

-- Fix 3: Secure course reviews - remove anonymous access
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.course_reviews;

CREATE POLICY "Authenticated users can create their own reviews" 
ON public.course_reviews 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own reviews" 
ON public.course_reviews 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own reviews" 
ON public.course_reviews 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 4: Secure interview questions - require authentication for submissions
DROP POLICY IF EXISTS "Authenticated users can submit questions" ON public.interview_questions;

CREATE POLICY "Authenticated users can submit questions" 
ON public.interview_questions 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated' AND 
  submitted_by = auth.email()
);

-- Fix 5: Update function search paths to be immutable
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Fix 6: Add role change audit table
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  old_role app_role NOT NULL,
  new_role app_role NOT NULL,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role change audit" 
ON public.role_change_audit 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix 7: Update role change function to include audit logging
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role app_role,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_role app_role;
  old_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Get old role for logging
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE id = target_user_id;
  
  -- Insert audit record
  INSERT INTO public.role_change_audit (
    target_user_id, 
    old_role, 
    new_role, 
    changed_by, 
    reason
  ) VALUES (
    target_user_id, 
    old_role, 
    new_role, 
    auth.uid(), 
    reason
  );
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;
