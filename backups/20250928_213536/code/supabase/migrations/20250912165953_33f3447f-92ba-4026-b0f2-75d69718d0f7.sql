-- Update get_profiles_secure function to remove unused fields
CREATE OR REPLACE FUNCTION public.get_profiles_secure(requesting_user_role text DEFAULT NULL::text, target_user_ids uuid[] DEFAULT NULL::uuid[], include_sensitive_fields boolean DEFAULT false)
 RETURNS TABLE(id uuid, email text, full_name text, role text, created_at timestamp with time zone, last_login_at timestamp with time zone, total_session_time_minutes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role text;
  is_admin boolean := false;
BEGIN
  -- Get current user role if not provided
  IF requesting_user_role IS NULL THEN
    SELECT p.role::text INTO current_user_role
    FROM public.profiles p 
    WHERE p.id = auth.uid();
  ELSE
    current_user_role := requesting_user_role;
  END IF;
  
  -- Check if user is admin
  is_admin := (current_user_role = 'admin');
  
  -- Log sensitive data access attempt
  PERFORM public.log_security_event(
    'sensitive_profiles_access',
    auth.uid(),
    auth.email(),
    'profiles',
    'bulk_profile_query',
    true,
    CASE WHEN is_admin THEN 'medium' ELSE 'high' END,
    json_build_object(
      'requesting_role', current_user_role,
      'target_count', CASE WHEN target_user_ids IS NULL THEN 'all' ELSE array_length(target_user_ids, 1) END,
      'include_sensitive', include_sensitive_fields,
      'is_admin', is_admin
    )
  );
  
  -- Return essential profile data only
  RETURN QUERY
  SELECT 
    p.id,
    CASE 
      WHEN is_admin OR auth.uid() = p.id THEN p.email
      ELSE CONCAT(LEFT(SPLIT_PART(p.email, '@', 1), 2), '***@', SPLIT_PART(p.email, '@', 2))
    END as email,
    p.full_name,
    p.role::text,
    p.created_at,
    CASE 
      WHEN is_admin OR auth.uid() = p.id THEN p.last_login_at
      ELSE NULL
    END as last_login_at,
    CASE 
      WHEN is_admin OR auth.uid() = p.id THEN p.total_session_time_minutes
      ELSE NULL
    END as total_session_time_minutes
  FROM public.profiles p
  WHERE 
    (target_user_ids IS NULL OR p.id = ANY(target_user_ids))
    AND (is_admin OR auth.uid() = p.id)
  ORDER BY p.created_at DESC;
END;
$function$;

-- Update update_profile_secure function to remove unused fields
CREATE OR REPLACE FUNCTION public.update_profile_secure(target_user_id uuid, profile_updates jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role text;
  is_admin boolean := false;
  allowed_fields text[] := ARRAY['full_name', 'general_notes'];
  admin_only_fields text[] := ARRAY['email', 'role'];
  field_key text;
  old_profile_data jsonb;
  sensitive_changes jsonb := '{}';
BEGIN
  -- Get current user role
  SELECT p.role::text INTO current_user_role
  FROM public.profiles p 
  WHERE p.id = auth.uid();
  
  is_admin := (current_user_role = 'admin');
  
  -- Check permissions
  IF NOT is_admin AND auth.uid() != target_user_id THEN
    RETURN json_build_object('error', 'Insufficient permissions to update this profile');
  END IF;
  
  -- Get current profile data for audit trail
  SELECT to_jsonb(p.*) INTO old_profile_data
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Validate and filter allowed fields
  FOR field_key IN SELECT jsonb_object_keys(profile_updates)
  LOOP
    IF field_key = ANY(admin_only_fields) AND NOT is_admin THEN
      RETURN json_build_object('error', 'Field ' || field_key || ' requires admin privileges');
    END IF;
    
    IF NOT (field_key = ANY(allowed_fields) OR (is_admin AND field_key = ANY(admin_only_fields))) THEN
      RETURN json_build_object('error', 'Field ' || field_key || ' is not allowed to be updated');
    END IF;
    
    -- Track sensitive field changes
    IF field_key = ANY(admin_only_fields) THEN
      sensitive_changes := sensitive_changes || jsonb_build_object(field_key, profile_updates->field_key);
    END IF;
  END LOOP;
  
  -- Perform the update with row-level security
  UPDATE public.profiles
  SET 
    full_name = COALESCE(profile_updates->>'full_name', full_name),
    email = CASE WHEN is_admin THEN COALESCE(profile_updates->>'email', email) ELSE email END,
    role = CASE WHEN is_admin THEN COALESCE((profile_updates->>'role')::app_role, role) ELSE role END,
    general_notes = COALESCE(profile_updates->>'general_notes', general_notes),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the profile update with sensitive field tracking
  PERFORM public.log_security_event(
    'secure_profile_update',
    auth.uid(),
    auth.email(),
    'profiles',
    'update_profile',
    true,
    CASE WHEN jsonb_object_keys(sensitive_changes) IS NOT NULL THEN 'high' ELSE 'medium' END,
    json_build_object(
      'target_user_id', target_user_id,
      'updated_fields', array(SELECT jsonb_object_keys(profile_updates)),
      'sensitive_fields_changed', array(SELECT jsonb_object_keys(sensitive_changes)),
      'is_self_update', auth.uid() = target_user_id,
      'updated_by_admin', is_admin
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'updated_fields', array(SELECT jsonb_object_keys(profile_updates)),
    'target_user_id', target_user_id
  );
END;
$function$;

-- Update get_secure_profile function to remove unused fields
CREATE OR REPLACE FUNCTION public.get_secure_profile(target_user_id uuid)
 RETURNS TABLE(id uuid, email text, full_name text, role text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
  is_own_profile boolean;
  profile_record profiles%ROWTYPE;
BEGIN
  -- Get requesting user role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p 
  WHERE p.id = auth.uid();
  
  -- Check if viewing own profile
  is_own_profile := (auth.uid() = target_user_id);
  
  -- Only allow admins or users viewing their own profile
  IF requesting_user_role != 'admin' AND NOT is_own_profile THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
  
  -- Get profile data
  SELECT * INTO profile_record
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Log sensitive data access
  PERFORM public.log_security_event(
    'sensitive_profile_access',
    auth.uid(),
    auth.email(),
    'profiles',
    'view_profile',
    true,
    CASE WHEN is_own_profile THEN 'low' ELSE 'medium' END,
    json_build_object(
      'target_user_id', target_user_id,
      'is_own_profile', is_own_profile,
      'requesting_user_role', requesting_user_role
    )
  );
  
  -- Return essential data only
  RETURN QUERY
  SELECT 
    profile_record.id,
    profile_record.email,
    profile_record.full_name,
    profile_record.role::text,
    profile_record.created_at;
END;
$function$;