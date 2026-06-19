-- Edge functions verify Clerk JWT in-handler and call check_rate_limit via service role,
-- so auth.uid() is NULL. Accept actor_key (e.g. "user_xxx:1.2.3.4") from trusted handlers.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_name text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15,
  actor_key text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  rate_user_id text;
  attempt_count integer;
  window_start timestamptz;
BEGIN
  rate_user_id := COALESCE(
    NULLIF(auth.uid()::text, ''),
    NULLIF(split_part(COALESCE(actor_key, ''), ':', 1), '')
  );

  IF rate_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  window_start := now() - (window_minutes || ' minutes')::interval;

  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit_log
  WHERE user_id = rate_user_id
    AND action = operation_name
    AND created_at >= window_start;

  IF attempt_count >= max_attempts THEN
    INSERT INTO public.security_audit_log (user_id, action, details)
    VALUES (
      rate_user_id,
      'rate_limit_exceeded',
      json_build_object(
        'operation', operation_name,
        'attempts', attempt_count,
        'actor_key', actor_key
      )
    );
    RETURN FALSE;
  END IF;

  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (
    rate_user_id,
    operation_name,
    json_build_object('timestamp', now(), 'actor_key', actor_key)
  );

  RETURN TRUE;
END;
$function$;
