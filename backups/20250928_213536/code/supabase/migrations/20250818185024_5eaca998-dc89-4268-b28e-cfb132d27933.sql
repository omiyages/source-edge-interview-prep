
-- Fix critical privilege escalation vulnerability and strengthen database security

-- 1. Update database functions to use proper search_path protection
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
    'user'::public.app_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_approve_admin_questions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
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
SET search_path = ''
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Add audit logging table for role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  old_role app_role,
  new_role app_role NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone DEFAULT now(),
  reason text,
  ip_address inet,
  user_agent text
);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role change audit" 
ON public.role_change_audit 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 3. Create function to safely update user roles with audit logging
CREATE OR REPLACE FUNCTION public.update_user_role_with_audit(
  target_user_id uuid,
  new_role app_role,
  reason text DEFAULT NULL,
  ip_address inet DEFAULT NULL,
  user_agent text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  old_role app_role;
  result json;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = current_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('error', 'Only admins can update user roles');
  END IF;
  
  -- Prevent self role changes for additional security
  IF current_user_id = target_user_id THEN
    RETURN json_build_object('error', 'Users cannot change their own role');
  END IF;
  
  -- Get current role
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE id = target_user_id;
  
  IF old_role IS NULL THEN
    RETURN json_build_object('error', 'Target user not found');
  END IF;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the change
  INSERT INTO public.role_change_audit (
    target_user_id, old_role, new_role, changed_by, reason, ip_address, user_agent
  ) VALUES (
    target_user_id, old_role, new_role, current_user_id, reason, ip_address, user_agent
  );
  
  RETURN json_build_object(
    'success', true,
    'old_role', old_role,
    'new_role', new_role,
    'target_user_id', target_user_id
  );
END;
$$;

-- 4. Strengthen RLS policies to prevent privilege escalation
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;

-- Split profile updates to prevent role changes
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevent role change
);

-- Only admins can update roles through the secure function
CREATE POLICY "Only secure role updates allowed" 
ON public.profiles 
FOR UPDATE 
USING (false) -- Block direct role updates
WITH CHECK (false); -- Block direct role updates

-- 5. Add database constraint to prevent direct role manipulation
ALTER TABLE public.profiles ADD CONSTRAINT prevent_self_role_change 
CHECK (id != auth.uid() OR role = (SELECT role FROM public.profiles p WHERE p.id = auth.uid()));

-- 6. Create trigger to log all profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log role changes specifically
  IF OLD.role != NEW.role THEN
    INSERT INTO public.role_change_audit (
      target_user_id, old_role, new_role, changed_by, reason
    ) VALUES (
      NEW.id, OLD.role, NEW.role, auth.uid(), 'Direct database update'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_changes_audit_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- 7. Tighten RLS policies to remove unnecessary anonymous access
DROP POLICY IF EXISTS "Authenticated users can view hiring stages" ON public.hiring_stages;
CREATE POLICY "Authenticated users can view hiring stages" 
ON public.hiring_stages 
FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;
CREATE POLICY "Authenticated users can view courses" 
ON public.courses 
FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.resources;
CREATE POLICY "Authenticated users can view resources" 
ON public.resources 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 8. Add rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation text NOT NULL,
  attempts integer DEFAULT 1,
  first_attempt timestamp with time zone DEFAULT now(),
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  UNIQUE(user_id, operation)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (user_id = auth.uid());

-- 9. Create function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_name text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  current_time timestamp with time zone;
  rate_record record;
BEGIN
  current_user_id := auth.uid();
  current_time := now();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get or create rate limit record
  SELECT * INTO rate_record 
  FROM public.rate_limits 
  WHERE user_id = current_user_id AND operation = operation_name;
  
  IF rate_record IS NULL THEN
    -- First attempt
    INSERT INTO public.rate_limits (user_id, operation, attempts, first_attempt, last_attempt)
    VALUES (current_user_id, operation_name, 1, current_time, current_time);
    RETURN true;
  END IF;
  
  -- Check if blocked
  IF rate_record.blocked_until IS NOT NULL AND rate_record.blocked_until > current_time THEN
    RETURN false;
  END IF;
  
  -- Check if window has reset
  IF current_time - rate_record.first_attempt > (window_minutes || ' minutes')::interval THEN
    -- Reset window
    UPDATE public.rate_limits 
    SET attempts = 1, first_attempt = current_time, last_attempt = current_time, blocked_until = NULL
    WHERE user_id = current_user_id AND operation = operation_name;
    RETURN true;
  END IF;
  
  -- Increment attempts
  UPDATE public.rate_limits 
  SET attempts = attempts + 1, last_attempt = current_time
  WHERE user_id = current_user_id AND operation = operation_name;
  
  -- Check if limit exceeded
  IF rate_record.attempts >= max_attempts THEN
    UPDATE public.rate_limits 
    SET blocked_until = current_time + (window_minutes || ' minutes')::interval
    WHERE user_id = current_user_id AND operation = operation_name;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;
