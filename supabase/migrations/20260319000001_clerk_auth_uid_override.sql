-- ============================================================================
-- Migration: Override auth.uid() to read Clerk-issued supabase_uuid claim
-- ============================================================================
-- Clerk reserves the "sub" claim (it's always the Clerk user ID, e.g. user_2abc).
-- Our JWT template instead sets a custom claim "supabase_uuid" containing the
-- user's Supabase UUID.  This function makes auth.uid() transparent to that,
-- so all existing RLS policies that call auth.uid() continue to work unchanged.
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    -- Custom claim set by Clerk JWT template
    (auth.jwt() ->> 'supabase_uuid')::uuid,
    -- Fallback: legacy Supabase Auth tokens still use sub as UUID
    (auth.jwt() ->> 'sub')::uuid
  )
$$;
