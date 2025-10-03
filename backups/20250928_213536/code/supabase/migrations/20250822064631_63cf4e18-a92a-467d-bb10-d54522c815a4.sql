-- Security Enhancement: Database Function Hardening and Policy Optimization

-- Update database functions to have explicit search paths for security
CREATE OR REPLACE FUNCTION public.update_candidate_pipeline_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
 SET search_path TO ''
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

-- Update RLS policies for more explicit authentication checks
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.google_sheets_integrations;
CREATE POLICY "Users can view their own integrations" 
ON public.google_sheets_integrations 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own integrations" ON public.google_sheets_integrations;
CREATE POLICY "Users can create their own integrations" 
ON public.google_sheets_integrations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own integrations" ON public.google_sheets_integrations;
CREATE POLICY "Users can update their own integrations" 
ON public.google_sheets_integrations 
FOR UPDATE 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.google_sheets_integrations;
CREATE POLICY "Users can delete their own integrations" 
ON public.google_sheets_integrations 
FOR DELETE 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update user progress policies
DROP POLICY IF EXISTS "Authenticated users can view their own progress" ON public.user_progress;
CREATE POLICY "Authenticated users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update their progress" ON public.user_progress;
CREATE POLICY "Authenticated users can update their progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can modify their progress" ON public.user_progress;
CREATE POLICY "Authenticated users can modify their progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update course assignments policy
DROP POLICY IF EXISTS "Authenticated users can view their assigned courses" ON public.course_assignments;
CREATE POLICY "Authenticated users can view their assigned courses" 
ON public.course_assignments 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update candidates policies
DROP POLICY IF EXISTS "Secure candidate access" ON public.candidates;
CREATE POLICY "Secure candidate access" 
ON public.candidates 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.role() = 'authenticated' AND auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can create their own candidate record" ON public.candidates;
CREATE POLICY "Users can create their own candidate record" 
ON public.candidates 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own candidate data" ON public.candidates;
CREATE POLICY "Users can update their own candidate data" 
ON public.candidates 
FOR UPDATE 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update course reviews policies
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.course_reviews;
CREATE POLICY "Users can create their own reviews" 
ON public.course_reviews 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.course_reviews;
CREATE POLICY "Users can update their own reviews" 
ON public.course_reviews 
FOR UPDATE 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own reviews" ON public.course_reviews;
CREATE POLICY "Users can view their own reviews" 
ON public.course_reviews 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update profiles policies
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated' AND id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.role() = 'authenticated' AND id = auth.uid())
WITH CHECK (auth.role() = 'authenticated' AND id = auth.uid() AND role = ( SELECT profiles_1.role FROM profiles profiles_1 WHERE profiles_1.id = auth.uid()));

-- Update user sessions policies
DROP POLICY IF EXISTS "Authenticated users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Authenticated users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert their own sessions" ON public.user_sessions;
CREATE POLICY "Authenticated users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update their own sessions" ON public.user_sessions;
CREATE POLICY "Authenticated users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Update question likes policy
DROP POLICY IF EXISTS "Auth users can manage their own likes" ON public.question_likes;
CREATE POLICY "Auth users can manage their own likes" 
ON public.question_likes 
FOR ALL 
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update candidate pipeline policy
DROP POLICY IF EXISTS "Authenticated users can view their own pipeline status" ON public.candidate_pipeline;
CREATE POLICY "Authenticated users can view their own pipeline status" 
ON public.candidate_pipeline 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.role() = 'authenticated' AND candidate_id = auth.uid()));

-- Create enhanced security logging table for better monitoring
CREATE TABLE IF NOT EXISTS public.enhanced_security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  user_email text,
  user_agent text,
  ip_address inet,
  resource_accessed text,
  action_attempted text,
  success boolean NOT NULL DEFAULT false,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on enhanced security events
ALTER TABLE public.enhanced_security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.enhanced_security_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.enhanced_security_events 
FOR INSERT 
WITH CHECK (true);

-- Create function for logging enhanced security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_user_email text DEFAULT auth.email(),
  p_resource_accessed text DEFAULT NULL,
  p_action_attempted text DEFAULT NULL,
  p_success boolean DEFAULT false,
  p_risk_level text DEFAULT 'low',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.enhanced_security_events (
    event_type,
    user_id,
    user_email,
    resource_accessed,
    action_attempted,
    success,
    risk_level,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_user_email,
    p_resource_accessed,
    p_action_attempted,
    p_success,
    p_risk_level,
    p_metadata
  );
END;
$function$;