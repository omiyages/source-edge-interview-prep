-- CRITICAL SECURITY FIX: Restrict candidates table access
-- Remove the overly permissive policy that allows any authenticated user to view all candidates
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;

-- Create a secure policy that only allows admins to view all candidates
-- Individual users should only see their own candidate record if they have one
CREATE POLICY "Secure candidate access" 
ON public.candidates 
FOR SELECT 
USING (
  -- Admins can see all candidates
  has_role(auth.uid(), 'admin'::public.app_role) OR
  -- Users can only see their own candidate record
  (user_id = auth.uid() AND is_user = true)
);

-- Ensure only admins can modify candidate data
CREATE POLICY "Admins can insert candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update candidates" 
ON public.candidates 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete candidates" 
ON public.candidates 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::public.app_role));

-- Add audit logging for candidate access
CREATE OR REPLACE FUNCTION public.log_candidate_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log sensitive data access
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    'candidate_data_access',
    json_build_object(
      'candidate_id', NEW.id,
      'accessed_fields', json_build_array('email', 'phone_number', 'salary'),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS log_candidate_access_trigger ON public.candidates;
CREATE TRIGGER log_candidate_access_trigger
  AFTER SELECT ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.log_candidate_access();