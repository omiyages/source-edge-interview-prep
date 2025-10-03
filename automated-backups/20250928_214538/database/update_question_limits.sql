-- Update database validation limits for question submission
-- Run this in Supabase SQL Editor

-- Update the validate_question_input function to allow 10,000 characters
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
  -- Check question length (updated to 10,000)
  IF length(question_text) < 10 OR length(question_text) > 10000 THEN
    validation_errors := array_append(validation_errors, 'Question must be between 10 and 10,000 characters');
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
  
  -- Check additional context if provided (updated to 10,000)
  IF additional_context IS NOT NULL AND length(additional_context) > 10000 THEN
    validation_errors := array_append(validation_errors, 'Additional context must be less than 10,000 characters');
  END IF;
  
  -- Return validation result
  IF array_length(validation_errors, 1) > 0 THEN
    RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
  END IF;
  
  RETURN true;
END;
$$;
