
-- Drop Google Sheets related tables and functions
DROP TABLE IF EXISTS public.google_sheets_candidate_imports CASCADE;
DROP TABLE IF EXISTS public.google_sheets_integrations CASCADE;

-- Drop ATS/Kanban related tables
DROP TABLE IF EXISTS public.candidate_pipeline CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.hiring_stages CASCADE;

-- Drop Google Sheets related functions
DROP FUNCTION IF EXISTS public.encrypt_access_token(text);
DROP FUNCTION IF EXISTS public.block_direct_token_access();
DROP FUNCTION IF EXISTS public.auto_encrypt_access_token();
DROP FUNCTION IF EXISTS public.encrypt_token(text);
DROP FUNCTION IF EXISTS public.audit_integration_changes();
DROP FUNCTION IF EXISTS public.get_safe_integration_data(uuid);
DROP FUNCTION IF EXISTS public.validate_token_access(uuid);
DROP FUNCTION IF EXISTS public.encrypt_tokens_automatically();
DROP FUNCTION IF EXISTS public.get_user_integrations();
DROP FUNCTION IF EXISTS public.validate_token_ownership(uuid);
DROP FUNCTION IF EXISTS public.secure_google_api_proxy(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS public.validate_google_token_status(uuid);
DROP FUNCTION IF EXISTS public.update_integration_token(uuid, text);
DROP FUNCTION IF EXISTS public.monitor_oauth_security();

-- Drop hiring stages related functions
DROP FUNCTION IF EXISTS public.update_candidate_pipeline_updated_at();
DROP FUNCTION IF EXISTS public.update_hiring_stages_updated_at();
