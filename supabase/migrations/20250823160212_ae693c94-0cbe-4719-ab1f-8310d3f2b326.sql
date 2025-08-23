-- Fix Security Definer View issue by removing the problematic view
-- The safe_google_integrations view is causing security concerns

-- Drop the existing view
DROP VIEW IF EXISTS public.safe_google_integrations;

-- Instead of using a view, we'll ensure the google_sheets_integrations table 
-- has proper RLS policies that prevent token exposure
-- The existing RLS policies already handle this correctly by restricting access to token owners

-- Create a helper function to get integration data without tokens (more secure approach)
CREATE OR REPLACE FUNCTION public.get_user_integrations()
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
  token_status text
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
    CASE 
      WHEN g.access_token IS NOT NULL AND length(g.access_token) > 0 
      THEN 'configured'::text 
      ELSE 'not_configured'::text 
    END as token_status
  FROM public.google_sheets_integrations g
  WHERE g.user_id = auth.uid();
$function$;