
-- Complete removal of Google Sheets integration system
-- This eliminates ALL Google OAuth token exposure risks

-- Drop all Google Sheets related functions (in correct order to handle dependencies)
DROP FUNCTION IF EXISTS public.monitor_oauth_security();
DROP FUNCTION IF EXISTS public.update_integration_token(uuid, text);
DROP FUNCTION IF EXISTS public.validate_google_token_status(uuid);
DROP FUNCTION IF EXISTS public.secure_google_api_proxy(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS public.audit_integration_changes();
DROP FUNCTION IF EXISTS public.encrypt_tokens_automatically();
DROP FUNCTION IF EXISTS public.validate_token_ownership(uuid);
DROP FUNCTION IF EXISTS public.get_user_integrations();
DROP FUNCTION IF EXISTS public.encrypt_token(text);
DROP FUNCTION IF EXISTS public.auto_encrypt_access_token();
DROP FUNCTION IF EXISTS public.block_direct_token_access();
DROP FUNCTION IF EXISTS public.encrypt_access_token(text);
DROP FUNCTION IF EXISTS public.get_safe_integration_data(uuid);
DROP FUNCTION IF EXISTS public.validate_token_access(uuid);

-- Drop all Google Sheets related triggers
DROP TRIGGER IF EXISTS encrypt_google_tokens_trigger ON public.google_sheets_integrations;
DROP TRIGGER IF EXISTS audit_google_integration_changes_trigger ON public.google_sheets_integrations;
DROP TRIGGER IF EXISTS auto_encrypt_token_trigger ON public.google_sheets_integrations;

-- Drop all Google Sheets related tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS public.google_sheets_candidate_imports;
DROP TABLE IF EXISTS public.google_sheets_integrations;

-- Clean up any orphaned security events related to Google Sheets
DELETE FROM public.enhanced_security_events 
WHERE event_type IN (
    'token_encrypted',
    'blocked_token_access', 
    'auto_token_encryption',
    'admin_action',
    'token_access_attempt',
    'secure_api_proxy_used',
    'token_validation_check',
    'secure_token_update',
    'suspicious_token_access'
) OR resource_accessed = 'google_sheets_integrations';

-- Clean up any audit log entries related to Google Sheets
DELETE FROM public.security_audit_log 
WHERE details::text LIKE '%google_sheets%' 
   OR details::text LIKE '%token%'
   OR details::text LIKE '%integration%';
