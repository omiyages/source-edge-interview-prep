-- Idempotent cleanup after mistaken Glow Seoul schema was applied to this project (2026-05-27).
-- See migration history: glowseoul_core_schema_setup + revert_glowseoul_changes_20260527.

-- 1) Remove any remaining Glow Seoul auth hook (uses Supabase Auth, not Clerk)
DROP TRIGGER IF EXISTS glowseoul_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.glowseoul_handle_new_user();

-- 2) Drop Glow Seoul catalog / quiz tables if they still exist
DROP TABLE IF EXISTS public.saved_products CASCADE;
DROP TABLE IF EXISTS public.quiz_results CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;

-- 3) Remove Glow Seoul profile columns if present
ALTER TABLE public.profiles DROP COLUMN IF EXISTS skin_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS skin_concerns;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS quiz_completed;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscribed_to_newsletter;

-- 4) Drop Glow Seoul RLS policies (wrong auth.uid() pattern for Clerk)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'glowseoul_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 5) Remove obsolete check_rate_limit overload (always returned TRUE); keep actor_key version.
DROP FUNCTION IF EXISTS public.check_rate_limit(text, integer, integer);
