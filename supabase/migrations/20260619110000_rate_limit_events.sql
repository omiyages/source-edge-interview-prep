-- Dedicated rate-limit events table used by check_rate_limit RPC from Edge Functions.

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  operation_name TEXT NOT NULL,
  actor_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON public.rate_limit_events (operation_name, actor_key, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Fix ambiguous column reference (operation_name param vs column) that caused all RPC calls to fail.
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
  effective_actor_key TEXT;
  attempts_in_window INTEGER;
BEGIN
  IF operation_name IS NULL OR btrim(operation_name) = '' THEN
    RETURN FALSE;
  END IF;

  IF max_attempts IS NULL OR max_attempts < 1 THEN
    RETURN FALSE;
  END IF;

  IF window_minutes IS NULL OR window_minutes < 1 THEN
    RETURN FALSE;
  END IF;

  effective_actor_key := NULLIF(btrim(actor_key), '');
  IF effective_actor_key IS NULL THEN
    effective_actor_key := COALESCE(auth.uid()::TEXT, 'anonymous');
  END IF;

  DELETE FROM public.rate_limit_events
  WHERE created_at < now() - INTERVAL '24 hours';

  SELECT COUNT(*)
    INTO attempts_in_window
  FROM public.rate_limit_events AS r
  WHERE r.operation_name = check_rate_limit.operation_name
    AND r.actor_key = effective_actor_key
    AND r.created_at >= now() - make_interval(mins => window_minutes);

  IF attempts_in_window >= max_attempts THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limit_events (operation_name, actor_key)
  VALUES (check_rate_limit.operation_name, effective_actor_key);

  RETURN TRUE;
END;
$function$;
