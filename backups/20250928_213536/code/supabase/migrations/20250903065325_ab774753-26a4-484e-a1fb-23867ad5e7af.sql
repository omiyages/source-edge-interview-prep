-- CRITICAL SECURITY FIXES
-- Phase 1: Data Protection and Access Control

-- 1. Create secure data masking function for salary information
CREATE OR REPLACE FUNCTION public.mask_sensitive_profile_data(
  profile_data jsonb,
  requesting_user_role text,
  is_own_profile boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins or the profile owner can see full salary data
  IF requesting_user_role != 'admin' AND NOT is_own_profile THEN
    -- Mask salary to ranges for non-admins viewing other profiles
    IF (profile_data->>'salary')::integer IS NOT NULL THEN
      CASE 
        WHEN (profile_data->>'salary')::integer < 50000 THEN
          profile_data = jsonb_set(profile_data, '{salary_range}', '"$30k-$50k"');
        WHEN (profile_data->>'salary')::integer < 100000 THEN
          profile_data = jsonb_set(profile_data, '{salary_range}', '"$50k-$100k"');
        WHEN (profile_data->>'salary')::integer < 150000 THEN
          profile_data = jsonb_set(profile_data, '{salary_range}', '"$100k-$150k"');
        ELSE
          profile_data = jsonb_set(profile_data, '{salary_range}', '"$150k+"');
      END CASE;
      -- Remove exact salary
      profile_data = profile_data - 'salary';
    END IF;
    
    -- Mask phone numbers for non-admins
    IF profile_data->>'phone_number' IS NOT NULL THEN
      profile_data = jsonb_set(profile_data, '{phone_number}', '"***-***-****"');
    END IF;
  END IF;
  
  RETURN profile_data;
END;
$$;

-- 2. Enhanced profile view function with data masking
CREATE OR REPLACE FUNCTION public.get_secure_profile(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  current_company text,
  years_of_experience integer,
  skillsets text[],
  linkedin_profile text,
  salary_info jsonb,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Return masked data
  RETURN QUERY
  SELECT 
    profile_record.id,
    profile_record.email,
    profile_record.full_name,
    profile_record.role::text,
    profile_record.current_company,
    profile_record.years_of_experience,
    profile_record.skillsets,
    profile_record.linkedin_profile,
    public.mask_sensitive_profile_data(
      json_build_object(
        'salary', profile_record.salary,
        'phone_number', profile_record.phone_number
      )::jsonb,
      requesting_user_role,
      is_own_profile
    ) as salary_info,
    profile_record.is_active,
    profile_record.created_at;
END;
$$;

-- 3. Tighten RLS policies - Remove anonymous access where inappropriate
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;
CREATE POLICY "Authenticated users can view courses" 
ON public.courses 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view course stages" ON public.course_stages;
CREATE POLICY "Authenticated users can view course stages" 
ON public.course_stages 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.resources;
CREATE POLICY "Authenticated users can view resources" 
ON public.resources 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view dropdown options" ON public.dropdown_options;
CREATE POLICY "Authenticated users can view dropdown options" 
ON public.dropdown_options 
FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

-- 4. Enhanced input validation function for questions
CREATE OR REPLACE FUNCTION public.validate_question_input(
  question_text text,
  company_name text,
  role_name text,
  additional_context text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validation_errors text[] := '{}';
BEGIN
  -- Check question length
  IF length(question_text) < 10 OR length(question_text) > 2000 THEN
    validation_errors := array_append(validation_errors, 'Question must be between 10 and 2000 characters');
  END IF;
  
  -- Check for XSS patterns
  IF question_text ~* '<script|javascript:|on\w+\s*=|<iframe|<object' THEN
    -- Log XSS attempt
    PERFORM public.log_security_event(
      'xss_attempt_blocked',
      auth.uid(),
      auth.email(),
      'interview_questions',
      'insert_question',
      false,
      'critical',
      json_build_object(
        'question_snippet', left(question_text, 100),
        'company', company_name,
        'role', role_name
      )
    );
    validation_errors := array_append(validation_errors, 'Invalid content detected');
  END IF;
  
  -- Validate company and role
  IF length(company_name) < 2 OR length(company_name) > 100 THEN
    validation_errors := array_append(validation_errors, 'Company name must be between 2 and 100 characters');
  END IF;
  
  IF length(role_name) < 2 OR length(role_name) > 100 THEN
    validation_errors := array_append(validation_errors, 'Role name must be between 2 and 100 characters');
  END IF;
  
  -- Check additional context if provided
  IF additional_context IS NOT NULL AND length(additional_context) > 1000 THEN
    validation_errors := array_append(validation_errors, 'Additional context must be less than 1000 characters');
  END IF;
  
  -- Return validation result
  IF array_length(validation_errors, 1) > 0 THEN
    RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
  END IF;
  
  RETURN true;
END;
$$;

-- 5. Create trigger for question validation
CREATE OR REPLACE FUNCTION public.validate_question_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input before insertion
  PERFORM public.validate_question_input(
    NEW.question,
    NEW.company,
    NEW.role,
    NEW.additional_context
  );
  
  -- Sanitize input
  NEW.question = trim(NEW.question);
  NEW.company = trim(NEW.company);
  NEW.role = trim(NEW.role);
  
  IF NEW.additional_context IS NOT NULL THEN
    NEW.additional_context = trim(NEW.additional_context);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS validate_question_input_trigger ON public.interview_questions;
CREATE TRIGGER validate_question_input_trigger
  BEFORE INSERT OR UPDATE ON public.interview_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_question_before_insert();

-- 6. Enhanced rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit(
  operation_name text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check recent attempts for this operation
  SELECT COUNT(*) INTO recent_attempts
  FROM public.enhanced_security_events
  WHERE user_id = user_id
    AND event_type = operation_name
    AND created_at > now() - (window_minutes || ' minutes')::interval;
  
  IF recent_attempts >= max_attempts THEN
    -- Log rate limit exceeded
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      user_id,
      auth.email(),
      'rate_limiting',
      operation_name,
      false,
      'high',
      json_build_object(
        'operation', operation_name,
        'attempts', recent_attempts,
        'window_minutes', window_minutes
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;