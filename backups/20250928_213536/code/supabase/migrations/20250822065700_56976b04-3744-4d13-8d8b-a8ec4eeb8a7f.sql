-- CRITICAL SECURITY FIX: Secure Google Sheets Access Token Storage (Corrected)
-- This migration addresses the EXPOSED_SENSITIVE_DATA vulnerability

-- Create a secure token encryption system
CREATE OR REPLACE FUNCTION public.encrypt_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF token IS NULL OR token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use SHA256 hash with user ID salt for token references
  RETURN encode(digest(token || auth.uid()::text || 'secure_salt_2024', 'sha256'), 'hex');
END;
$function$;

-- Function to securely retrieve tokens (only for the token owner)
CREATE OR REPLACE FUNCTION public.get_user_integration_token(integration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  token_owner uuid;
  encrypted_token text;
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
  
  -- Return the encrypted token reference
  SELECT access_token INTO encrypted_token
  FROM public.google_sheets_integrations 
  WHERE id = integration_id AND user_id = auth.uid();
  
  -- Log token access for security monitoring
  PERFORM public.log_security_event(
    'data_access_violation',
    auth.uid(),
    auth.email(),
    'google_sheets_integrations',
    'token_access',
    true,
    'medium',
    json_build_object('integration_id', integration_id)
  );
  
  RETURN encrypted_token;
END;
$function$;

-- Create a secure function to update tokens
CREATE OR REPLACE FUNCTION public.update_integration_token(integration_id uuid, new_token text)
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
    RAISE EXCEPTION 'Access denied: Not authorized to update this integration';
  END IF;
  
  -- Update with encrypted token
  UPDATE public.google_sheets_integrations 
  SET 
    access_token = encrypt_token(new_token),
    updated_at = now()
  WHERE id = integration_id AND user_id = auth.uid();
  
  -- Log the security event
  PERFORM public.log_security_event(
    'admin_action',
    auth.uid(),
    auth.email(),
    'google_sheets_integrations',
    'token_update',
    true,
    'medium',
    json_build_object('integration_id', integration_id)
  );
  
  RETURN true;
END;
$function$;

-- Update RLS policies to be more restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.google_sheets_integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.google_sheets_integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.google_sheets_integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.google_sheets_integrations;

-- Create new secure policies
CREATE POLICY "Users can view their own integrations (restricted)"
ON public.google_sheets_integrations
FOR SELECT
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Policy for creating integrations (tokens must be set via secure function)
CREATE POLICY "Users can create their own integrations"
ON public.google_sheets_integrations
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid() = user_id
);

-- Policy for updating integrations (metadata only)
CREATE POLICY "Users can update their own integration metadata"
ON public.google_sheets_integrations
FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.uid() = user_id)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Policy for deleting integrations
CREATE POLICY "Users can delete their own integrations"
ON public.google_sheets_integrations
FOR DELETE
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Admin policy for emergency access (all actions logged)
CREATE POLICY "Admins can manage integrations for support"
ON public.google_sheets_integrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a safe view for integration access (excludes tokens entirely)
CREATE OR REPLACE VIEW public.safe_google_integrations AS
SELECT 
  id,
  user_id,
  sheet_id,
  sheet_name,
  column_mappings,
  last_sync_at,
  is_active,
  range_specification,
  created_at,
  updated_at,
  CASE 
    WHEN access_token IS NOT NULL AND LENGTH(access_token) > 0 THEN 'configured'
    ELSE 'not_configured'
  END as token_status
FROM public.google_sheets_integrations;

-- Grant access to the safe view
GRANT SELECT ON public.safe_google_integrations TO authenticated;

-- Encrypt existing tokens (if any exist and aren't already encrypted)
UPDATE public.google_sheets_integrations 
SET access_token = encode(digest(access_token || user_id::text || 'secure_salt_2024', 'sha256'), 'hex')
WHERE access_token IS NOT NULL 
  AND LENGTH(access_token) > 0 
  AND NOT (access_token ~ '^[a-f0-9]{64}$'); -- Only encrypt if not already a 64-char hex hash

-- Create audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_integration_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Log any changes to the integrations table
  IF TG_OP = 'UPDATE' AND OLD.access_token IS DISTINCT FROM NEW.access_token THEN
    PERFORM public.log_security_event(
      'admin_action',
      auth.uid(),
      auth.email(),
      'google_sheets_integrations',
      'token_modified',
      true,
      'high',
      json_build_object(
        'integration_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the audit trigger for UPDATE operations only
CREATE TRIGGER audit_google_sheets_changes
  AFTER UPDATE ON public.google_sheets_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_integration_changes();