
-- Complete removal of Google Sheets integration and related features
-- This will eliminate ALL OAuth token security risks

-- First, drop all dependent objects in correct order

-- Drop all triggers first
DROP TRIGGER IF EXISTS encrypt_google_tokens_trigger ON public.google_sheets_integrations;
DROP TRIGGER IF EXISTS audit_google_integration_changes_trigger ON public.google_sheets_integrations;
DROP TRIGGER IF EXISTS auto_encrypt_token_trigger ON public.google_sheets_integrations;

-- Drop all functions that reference the tables
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

-- Drop tables in correct order (dependent tables first)
DROP TABLE IF EXISTS public.google_sheets_candidate_imports CASCADE;
DROP TABLE IF EXISTS public.google_sheets_integrations CASCADE;

-- Drop candidate pipeline and hiring stages (ATS/Kanban feature)
DROP TABLE IF EXISTS public.candidate_pipeline CASCADE;
DROP TABLE IF EXISTS public.hiring_stages CASCADE;

-- Drop candidates table (part of ATS system)
DROP TABLE IF EXISTS public.candidates CASCADE;

-- Clean up security events related to removed features
DELETE FROM public.enhanced_security_events 
WHERE event_type IN (
    'token_encrypted',
    'blocked_token_access', 
    'auto_token_encryption',
    'token_access_attempt',
    'secure_api_proxy_used',
    'token_validation_check',
    'secure_token_update',
    'suspicious_token_access'
) OR resource_accessed IN ('google_sheets_integrations', 'candidates', 'candidate_pipeline', 'hiring_stages');

-- Clean up audit logs
DELETE FROM public.security_audit_log 
WHERE details::text LIKE '%google_sheets%' 
   OR details::text LIKE '%token%'
   OR details::text LIKE '%integration%'
   OR details::text LIKE '%candidate%'
   OR details::text LIKE '%hiring%';

-- Drop any remaining functions related to candidate management
DROP FUNCTION IF EXISTS public.update_candidate_pipeline_updated_at();
DROP FUNCTION IF EXISTS public.update_hiring_stages_updated_at();

-- Remove any RLS policies that might reference the dropped tables
-- (These will be automatically dropped with the tables, but being explicit)
