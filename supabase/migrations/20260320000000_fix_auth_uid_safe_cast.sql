-- ============================================================================
-- Migration: Fix clerk_uid() to safely handle non-UUID sub claims
-- ============================================================================
-- The previous SQL-language version of clerk_uid() would throw a PostgreSQL
-- exception when the "sub" claim is a Clerk user ID ("user_2abc") rather than
-- a UUID. This crashed all RLS policy evaluations for users without a
-- supabase_uuid claim (e.g. before the clerk-webhook fires on first sign-up).
--
-- Replaced with a PL/pgSQL version that catches invalid_text_representation
-- and returns NULL instead, so RLS denies access gracefully rather than
-- throwing a 500-level error.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clerk_uid()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  supabase_uuid_val uuid;
  sub_val uuid;
BEGIN
  -- Try supabase_uuid custom claim first (set by the Clerk JWT template).
  BEGIN
    supabase_uuid_val := (auth.jwt() ->> 'supabase_uuid')::uuid;
  EXCEPTION WHEN invalid_text_representation OR others THEN
    supabase_uuid_val := NULL;
  END;

  IF supabase_uuid_val IS NOT NULL THEN
    RETURN supabase_uuid_val;
  END IF;

  -- Fallback: try sub claim. Works for Supabase Auth JWTs and Clerk JWT
  -- templates where sub = Supabase UUID. Returns NULL (not an exception) if
  -- sub is a Clerk user ID like "user_2abc".
  BEGIN
    sub_val := (auth.jwt() ->> 'sub')::uuid;
  EXCEPTION WHEN invalid_text_representation OR others THEN
    sub_val := NULL;
  END;

  RETURN sub_val;
END;
$$;
