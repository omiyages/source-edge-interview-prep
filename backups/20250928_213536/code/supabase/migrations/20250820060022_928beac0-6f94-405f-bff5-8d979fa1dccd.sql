
-- CRITICAL SECURITY FIXES - Step 1: Database Security Hardening

-- Fix 1: Remove overly permissive RLS policy on candidates table
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;

-- Add proper RLS policies for candidates table
CREATE POLICY "Admins can manage all candidates" 
ON public.candidates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own candidate record" 
ON public.candidates 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix 2: Harden database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_candidate_pipeline_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_approve_admin_questions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  -- Check if the submitter is an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = NEW.submitted_by 
    AND role = 'admin'
  ) THEN
    NEW.status = 'approved';
    NEW.approved_at = now();
    NEW.approved_by = (
      SELECT id FROM public.profiles 
      WHERE email = NEW.submitted_by
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix 3: Implement proper rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_name text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_ip TEXT;
  current_user_id UUID;
  attempt_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE; -- Deny anonymous requests
  END IF;
  
  -- Calculate window start time
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Count recent attempts for this user and operation
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND action = operation_name
    AND created_at >= window_start;
  
  -- Check if limit exceeded
  IF attempt_count >= max_attempts THEN
    -- Log rate limit violation
    INSERT INTO public.security_audit_log (user_id, action, details)
    VALUES (current_user_id, 'rate_limit_exceeded', 
            json_build_object('operation', operation_name, 'attempts', attempt_count));
    RETURN FALSE;
  END IF;
  
  -- Log the attempt
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (current_user_id, operation_name, 
          json_build_object('timestamp', now()));
  
  RETURN TRUE;
END;
$function$;

-- Fix 4: Add audit triggers for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_candidate_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log access to candidate data
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (
    auth.uid(),
    'candidate_data_access',
    json_build_object(
      'candidate_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create audit trigger for candidates table
DROP TRIGGER IF EXISTS audit_candidate_access_trigger ON public.candidates;
CREATE TRIGGER audit_candidate_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.audit_candidate_access();

-- Fix 5: Strengthen Google Sheets integration security
ALTER TABLE public.google_sheets_integrations 
ADD COLUMN IF NOT EXISTS encrypted_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update RLS policy for Google Sheets integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.google_sheets_integrations;
CREATE POLICY "Users can manage their own integrations" 
ON public.google_sheets_integrations 
FOR ALL 
USING (auth.uid() = user_id);

-- Fix 6: Add constraints for data integrity
ALTER TABLE public.candidates 
ADD CONSTRAINT candidates_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
