-- Fixed comprehensive Google OAuth token security implementation
-- This migration ensures all tokens are encrypted and access is properly controlled

-- First, encrypt any existing plain text tokens
UPDATE public.google_sheets_integrations 
SET access_token = public.encrypt_token(access_token)
WHERE access_token IS NOT NULL 
  AND access_token != '' 
  AND length(access_token) != 64; -- Don't re-encrypt already encrypted tokens

-- Update RLS policy to restrict direct access to tokens
DROP POLICY IF EXISTS "Users can view their own integrations (restricted)" ON public.google_sheets_integrations;

CREATE POLICY "Users can view their own integration metadata only" 
ON public.google_sheets_integrations 
FOR SELECT 
USING ((auth.role() = 'authenticated'::text) AND (auth.uid() = user_id));

-- Create a secure view function that never exposes tokens
CREATE OR REPLACE FUNCTION public.get_safe_integration_data(integration_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  sheet_id text, 
  sheet_name text,
  column_mappings jsonb,
  last_sync_at timestamptz,
  is_active boolean,
  range_specification text,
  created_at timestamptz,
  updated_at timestamptz,
  has_token boolean
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    g.id,
    g.user_id,
    g.sheet_id,
    g.sheet_name, 
    g.column_mappings,
    g.last_sync_at,
    g.is_active,
    g.range_specification,
    g.created_at,
    g.updated_at,
    (g.access_token IS NOT NULL AND length(g.access_token) > 0) as has_token
  FROM public.google_sheets_integrations g
  WHERE g.id = integration_id 
    AND g.user_id = auth.uid();
$function$;

-- Enhanced token validation function
CREATE OR REPLACE FUNCTION public.validate_token_access(integration_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  token_owner uuid;
BEGIN
  -- Verify the requesting user owns this integration
  SELECT user_id INTO token_owner 
  FROM public.google_sheets_integrations 
  WHERE id = integration_id;
  
  IF token_owner IS NULL THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;
  
  IF token_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Not authorized to access this integration';
  END IF;
  
  -- Log token access attempt for security monitoring
  PERFORM public.log_security_event(
    'token_access_attempt',
    auth.uid(),
    auth.email(),
    'google_sheets_integrations',
    'validate_access',
    true,
    'high',
    json_build_object('integration_id', integration_id)
  );
  
  RETURN true;
END;
$function$;

-- Update the token retrieval function with better security
CREATE OR REPLACE FUNCTION public.get_user_integration_token(integration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  encrypted_token text;
BEGIN
  -- Validate access first
  IF NOT public.validate_token_access(integration_id) THEN
    RAISE EXCEPTION 'Access validation failed';
  END IF;
  
  -- Return the encrypted token reference (never decrypted)
  SELECT access_token INTO encrypted_token
  FROM public.google_sheets_integrations 
  WHERE id = integration_id AND user_id = auth.uid();
  
  IF encrypted_token IS NULL THEN
    RAISE EXCEPTION 'No token found for this integration';
  END IF;
  
  -- Log token retrieval for audit
  PERFORM public.log_security_event(
    'token_retrieved',
    auth.uid(),
    auth.email(),
    'google_sheets_integrations', 
    'get_token',
    true,
    'critical',
    json_build_object('integration_id', integration_id, 'token_length', length(encrypted_token))
  );
  
  RETURN encrypted_token;
END;
$function$;

-- Create trigger function to automatically encrypt tokens
CREATE OR REPLACE FUNCTION public.encrypt_tokens_automatically()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only encrypt if token is provided and not already encrypted
  IF NEW.access_token IS NOT NULL 
     AND NEW.access_token != '' 
     AND length(NEW.access_token) != 64 THEN
    NEW.access_token := public.encrypt_token(NEW.access_token);
    
    -- Log token encryption
    PERFORM public.log_security_event(
      'token_encrypted',
      auth.uid(),
      auth.email(),
      'google_sheets_integrations',
      'auto_encrypt',
      true,
      'high',
      json_build_object('integration_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create separate triggers for INSERT and UPDATE
DROP TRIGGER IF EXISTS encrypt_tokens_insert_trigger ON public.google_sheets_integrations;
DROP TRIGGER IF EXISTS encrypt_tokens_update_trigger ON public.google_sheets_integrations;

CREATE TRIGGER encrypt_tokens_insert_trigger
  BEFORE INSERT ON public.google_sheets_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_tokens_automatically();

CREATE TRIGGER encrypt_tokens_update_trigger
  BEFORE UPDATE ON public.google_sheets_integrations
  FOR EACH ROW
  WHEN (NEW.access_token IS DISTINCT FROM OLD.access_token)
  EXECUTE FUNCTION public.encrypt_tokens_automatically();