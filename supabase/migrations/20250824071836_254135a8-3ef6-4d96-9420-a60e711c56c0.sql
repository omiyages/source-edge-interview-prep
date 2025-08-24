-- CRITICAL SECURITY FIX: Prevent Self-Role Privilege Escalation
-- Fix the update_user_role_with_audit function to prevent all self-role changes

CREATE OR REPLACE FUNCTION public.update_user_role_with_audit(
  target_user_id uuid, 
  new_role text, 
  reason text DEFAULT 'No reason provided'::text, 
  user_agent text DEFAULT 'Unknown'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  requesting_user_id UUID;
  requesting_user_role TEXT;
  old_role TEXT;
  result JSON;
BEGIN
  -- Get requesting user
  requesting_user_id := auth.uid();
  
  -- CRITICAL FIX: Prevent ALL self-role changes (including null checks)
  IF requesting_user_id IS NULL THEN
    RETURN json_build_object('error', 'Authentication required');
  END IF;
  
  IF requesting_user_id = target_user_id THEN
    -- Log the blocked attempt for security monitoring
    PERFORM public.log_security_event(
      'blocked_self_role_change',
      requesting_user_id,
      auth.email(),
      'profiles',
      'update_role',
      false,
      'critical',
      json_build_object(
        'target_user_id', target_user_id,
        'attempted_role', new_role,
        'reason', reason,
        'user_agent', user_agent,
        'blocked_at', now()
      )
    );
    RETURN json_build_object('error', 'Cannot change your own role for security reasons');
  END IF;
  
  -- Check if requesting user is admin with additional validation
  SELECT role INTO requesting_user_role 
  FROM public.profiles 
  WHERE id = requesting_user_id AND is_active = true;
  
  IF requesting_user_role IS NULL THEN
    RETURN json_build_object('error', 'User profile not found or inactive');
  END IF;
  
  IF requesting_user_role != 'admin' THEN
    -- Log unauthorized role change attempt
    PERFORM public.log_security_event(
      'unauthorized_role_change_attempt',
      requesting_user_id,
      auth.email(),
      'profiles',
      'update_role',
      false,
      'critical',
      json_build_object(
        'requesting_user_role', requesting_user_role,
        'target_user_id', target_user_id,
        'attempted_role', new_role
      )
    );
    RETURN json_build_object('error', 'Admin privileges required');
  END IF;
  
  -- Get current role for audit with additional validation
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE id = target_user_id AND is_active = true;
  
  IF old_role IS NULL THEN
    RETURN json_build_object('error', 'Target user not found or inactive');
  END IF;
  
  -- Validate new role with strict enum checking
  IF new_role NOT IN ('user', 'admin') THEN
    RETURN json_build_object('error', 'Invalid role specified');
  END IF;
  
  -- Additional security: Prevent changing the last admin to user
  IF old_role = 'admin' AND new_role = 'user' THEN
    DECLARE admin_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO admin_count
      FROM public.profiles 
      WHERE role = 'admin' AND is_active = true AND id != target_user_id;
      
      IF admin_count = 0 THEN
        RETURN json_build_object('error', 'Cannot remove the last admin user');
      END IF;
    END;
  END IF;
  
  -- Set context for RLS policy validation
  PERFORM set_config('role_update_context', 'secure_function', true);
  
  -- Update the role with additional security checks
  UPDATE public.profiles 
  SET 
    role = new_role::public.app_role, 
    updated_at = now()
  WHERE id = target_user_id 
    AND is_active = true
    AND id != requesting_user_id; -- Additional safety check
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Failed to update role - security validation failed');
  END IF;
  
  -- Reset context
  PERFORM set_config('role_update_context', '', true);
  
  -- Log successful role change
  PERFORM public.log_security_event(
    'secure_role_change_success',
    requesting_user_id,
    auth.email(),
    'profiles',
    'update_role',
    true,
    'high',
    json_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role,
      'new_role', new_role,
      'reason', reason,
      'user_agent', user_agent,
      'changed_at', now()
    )
  );
  
  -- Return success result
  result := json_build_object(
    'success', TRUE,
    'old_role', old_role,
    'new_role', new_role,
    'target_user_id', target_user_id,
    'updated_at', now()
  );
  
  RETURN result;
END;
$function$;

-- SECURITY ENHANCEMENT: Create trigger to prevent direct role updates
CREATE OR REPLACE FUNCTION public.prevent_direct_role_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Allow updates only through the secure function context
  IF current_setting('role_update_context', true) != 'secure_function' THEN
    -- Allow users to update their own profile except the role
    IF auth.uid() = NEW.id AND OLD.role = NEW.role THEN
      RETURN NEW;
    END IF;
    
    -- Allow admins to update profiles through the secure function only
    IF has_role(auth.uid(), 'admin') AND current_setting('role_update_context', true) = 'secure_function' THEN
      RETURN NEW;
    END IF;
    
    -- Log blocked direct role change attempt
    PERFORM public.log_security_event(
      'blocked_direct_role_change',
      auth.uid(),
      auth.email(),
      'profiles',
      'direct_update_blocked',
      false,
      'critical',
      json_build_object(
        'target_user_id', NEW.id,
        'old_role', OLD.role,
        'attempted_new_role', NEW.role,
        'blocked_at', now()
      )
    );
    
    -- Block the role change
    RAISE EXCEPTION 'Role changes must be performed through secure admin functions only';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role change protection
DROP TRIGGER IF EXISTS prevent_role_changes ON public.profiles;
CREATE TRIGGER prevent_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.prevent_direct_role_updates();

-- ENHANCED RLS POLICY: Strengthen profile access control
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role" ON public.profiles
FOR UPDATE USING (
  (auth.role() = 'authenticated'::text) 
  AND (id = auth.uid())
  AND (
    -- Allow role updates only through secure function context by admins
    (current_setting('role_update_context', true) = 'secure_function' AND has_role(auth.uid(), 'admin'))
    OR
    -- Allow non-role updates by profile owner
    (current_setting('role_update_context', true) != 'secure_function')
  )
)
WITH CHECK (
  (auth.role() = 'authenticated'::text) 
  AND (id = auth.uid()) 
  AND (
    -- Prevent role changes in normal updates
    (role = (SELECT profiles_1.role FROM profiles profiles_1 WHERE profiles_1.id = auth.uid()))
    OR
    -- Allow role changes only through secure function by admins
    (current_setting('role_update_context', true) = 'secure_function' AND has_role(auth.uid(), 'admin'))
  )
);

-- SECURITY ENHANCEMENT: Add rate limiting for role changes
CREATE OR REPLACE FUNCTION public.enhanced_check_role_change_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Check role change attempts in the last hour
  SELECT COUNT(*) INTO recent_attempts
  FROM public.enhanced_security_events
  WHERE user_id = auth.uid()
    AND event_type IN ('secure_role_change_success', 'blocked_self_role_change', 'unauthorized_role_change_attempt')
    AND created_at > now() - interval '1 hour';
  
  -- Allow maximum 5 role change related operations per hour
  IF recent_attempts >= 5 THEN
    PERFORM public.log_security_event(
      'role_change_rate_limit_exceeded',
      auth.uid(),
      auth.email(),
      'profiles',
      'rate_limit_blocked',
      false,
      'high',
      json_build_object(
        'recent_attempts', recent_attempts,
        'time_window', '1 hour'
      )
    );
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- SECURITY AUDIT: Create comprehensive role change audit function
CREATE OR REPLACE FUNCTION public.audit_all_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Log all role changes with comprehensive details
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'profile_role_change_detected',
      auth.uid(),
      auth.email(),
      'profiles',
      'role_updated',
      true,
      'critical',
      json_build_object(
        'target_user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'change_method', COALESCE(current_setting('role_update_context', true), 'unknown'),
        'changed_by', auth.uid(),
        'timestamp', now(),
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create comprehensive audit trigger
DROP TRIGGER IF EXISTS audit_role_changes ON public.profiles;
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_all_role_changes();