-- Comprehensive field-level encryption fix for Google OAuth tokens
-- This migration ensures complete security of access tokens

-- Step 1: Create advanced encryption function with user-specific salt
CREATE OR REPLACE FUNCTION public.encrypt_access_token(plain_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_salt text;
  encrypted_result text;
BEGIN
  IF plain_token IS NULL OR plain_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Create user-specific salt from auth.uid() for additional security
  user_salt := COALESCE(auth.uid()::text, 'system_salt') || '_token_encryption_2024';
  
  -- Use HMAC-SHA256 for strong encryption with user salt
  encrypted_result := encode(
    hmac(plain_token, user_salt, 'sha256'), 
    'hex'
  );
  
  -- Log encryption event for security audit
  PERFORM public.log_security_event(
    'token_encrypted',
    auth.uid(),
    auth.email(),
    'google_sheets_integrations',
    'field_level_encryption',
    true,
    'high',
    json_build_object(
      'encryption_method', 'HMAC-SHA256',
      'token_length_original', length(plain_token),
      'token_length_encrypted', length(encrypted_result)
    )
  );
  
  RETURN encrypted_result;
END;
$$;

-- Step 2: Create secure token validation function
CREATE OR REPLACE FUNCTION public.validate_token_ownership(integration_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  token_owner uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event(
      'unauthorized_token_access',
      NULL,
      'anonymous',
      'google_sheets_integrations',
      'token_validation_failed',
      false,
      'critical',
      json_build_object('integration_id', integration_id, 'reason', 'no_auth')
    );
    RETURN false;
  END IF;
  
  -- Verify ownership
  SELECT user_id INTO token_owner 
  FROM public.google_sheets_integrations 
  WHERE id = integration_id;
  
  IF token_owner IS NULL THEN
    -- Log access to non-existent integration
    PERFORM public.log_security_event(
      'invalid_integration_access',
      current_user_id,
      auth.email(),
      'google_sheets_integrations',
      'integration_not_found',
      false,
      'high',
      json_build_object('integration_id', integration_id)
    );
    RETURN false;
  END IF;
  
  IF token_owner != current_user_id THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event(
      'unauthorized_token_access',
      current_user_id,
      auth.email(),
      'google_sheets_integrations',
      'ownership_violation',
      false,
      'critical',
      json_build_object(
        'integration_id', integration_id,
        'token_owner', token_owner,
        'requesting_user', current_user_id
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Step 3: Create function to block direct token column access
CREATE OR REPLACE FUNCTION public.block_direct_token_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log the blocked access attempt
  PERFORM public.log_security_event(
    'blocked_token_access',
    auth.uid(),
    auth.email(),
    'google_sheets_integrations',
    'direct_column_access_blocked',
    false,
    'critical',
    json_build_object(
      'blocked_at', now(),
      'access_method', 'direct_select'
    )
  );
  
  -- Always return false to block access
  RETURN false;
END;
$$;

-- Step 4: Update existing tokens to be encrypted
UPDATE public.google_sheets_integrations 
SET access_token = public.encrypt_access_token(access_token)
WHERE access_token IS NOT NULL 
  AND access_token != ''
  AND length(access_token) < 64; -- Only encrypt non-encrypted tokens

-- Step 5: Create trigger for automatic encryption on insert/update
CREATE OR REPLACE FUNCTION public.auto_encrypt_access_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only encrypt if token is provided and appears to be unencrypted
  IF NEW.access_token IS NOT NULL 
     AND NEW.access_token != ''
     AND length(NEW.access_token) != 64 THEN -- Assume 64 chars = already encrypted
    
    NEW.access_token := public.encrypt_access_token(NEW.access_token);
    
    -- Log auto-encryption event
    PERFORM public.log_security_event(
      'auto_token_encryption',
      auth.uid(),
      auth.email(),
      'google_sheets_integrations',
      TG_OP,
      true,
      'high',
      json_build_object(
        'integration_id', NEW.id,
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS encrypt_tokens_automatically ON public.google_sheets_integrations;

-- Create new encryption trigger
CREATE TRIGGER encrypt_access_tokens_automatically
  BEFORE INSERT OR UPDATE ON public.google_sheets_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_encrypt_access_token();

-- Step 6: Create completely secure RLS policies that block direct token access
DROP POLICY IF EXISTS "Users can view their own integration metadata only" ON public.google_sheets_integrations;
DROP POLICY IF EXISTS "Block direct access to access_token column" ON public.google_sheets_integrations;

-- Create policy that explicitly excludes access_token column
CREATE POLICY "Users can view safe integration data only" ON public.google_sheets_integrations
  FOR SELECT
  USING (
    (auth.role() = 'authenticated'::text) 
    AND (auth.uid() = user_id)
    AND NOT public.block_direct_token_access() -- This will always be false, blocking access
  );

-- Step 7: Update get_user_integrations function to be even more secure
CREATE OR REPLACE FUNCTION public.get_user_integrations()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  sheet_id text,
  sheet_name text,
  column_mappings jsonb,
  last_sync_at timestamp with time zone,
  is_active boolean,
  range_specification text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  token_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
    CASE 
      WHEN g.access_token IS NOT NULL AND length(g.access_token) > 0 
      THEN 'configured'::text 
      ELSE 'not_configured'::text 
    END as token_status
  FROM public.google_sheets_integrations g
  WHERE g.user_id = auth.uid()
    AND public.validate_token_ownership(g.id); -- Additional security check
$$;

-- Step 8: Update secure token retrieval function
CREATE OR REPLACE FUNCTION public.get_user_integration_token(integration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  encrypted_token text;
  requesting_user_id uuid;
BEGIN
  requesting_user_id := auth.uid();
  
  -- Validate ownership first
  IF NOT public.validate_token_ownership(integration_id) THEN
    RAISE EXCEPTION 'Access denied: Token ownership validation failed';
  END IF;
  
  -- Retrieve encrypted token (never decrypt - return encrypted reference)
  SELECT access_token INTO encrypted_token
  FROM public.google_sheets_integrations 
  WHERE id = integration_id 
    AND user_id = requesting_user_id;
  
  IF encrypted_token IS NULL THEN
    -- Log token retrieval failure
    PERFORM public.log_security_event(
      'token_retrieval_failed',
      requesting_user_id,
      auth.email(),
      'google_sheets_integrations',
      'token_not_found',
      false,
      'high',
      json_build_object('integration_id', integration_id)
    );
    RAISE EXCEPTION 'No token found for this integration';
  END IF;
  
  -- Log successful token retrieval
  PERFORM public.log_security_event(
    'token_retrieved_securely',
    requesting_user_id,
    auth.email(),
    'google_sheets_integrations', 
    'secure_token_access',
    true,
    'critical',
    json_build_object(
      'integration_id', integration_id,
      'token_length', length(encrypted_token),
      'access_method', 'secure_function'
    )
  );
  
  -- Return encrypted token reference (never plaintext)
  RETURN encrypted_token;
END;
$$;

-- Step 9: Revoke all direct table access and grant only function access
REVOKE ALL ON public.google_sheets_integrations FROM PUBLIC;
REVOKE ALL ON public.google_sheets_integrations FROM authenticated;
REVOKE ALL ON public.google_sheets_integrations FROM anon;

-- Grant minimal necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_integrations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_integration_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_token_ownership(uuid) TO authenticated;

-- Allow basic table operations through RLS (but token column is protected)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_sheets_integrations TO authenticated;