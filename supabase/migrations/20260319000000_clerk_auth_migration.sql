-- ============================================================================
-- Migration: Prepare database for Clerk auth provider
-- ============================================================================
-- This migration:
--   1. Adds a clerk_id column to profiles for mapping Clerk ↔ Supabase users
--   2. Drops foreign keys from auth.users and re-points them to profiles(id)
--   3. Leaves RLS policies unchanged — Clerk JWTs will set auth.uid() to the
--      same UUID stored in profiles.id via the Clerk JWT template's "sub" claim
-- ============================================================================

-- 1. Add clerk_id column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

COMMENT ON COLUMN public.profiles.clerk_id
  IS 'Clerk user ID (user_xxx). Set by clerk-webhook on user creation.';

-- Create index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles (clerk_id)
  WHERE clerk_id IS NOT NULL;

-- 2. Drop FK from profiles.id → auth.users(id) and make it a standalone PK
--    The profiles table becomes the canonical user table.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop FK from profiles.created_by → auth.users(id)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;

-- 3. Re-point all other FKs from auth.users to profiles
--    Each block: drop old FK, add new FK referencing profiles(id)

-- interview_questions.approved_by
ALTER TABLE public.interview_questions DROP CONSTRAINT IF EXISTS interview_questions_approved_by_fkey;
ALTER TABLE public.interview_questions
  ADD CONSTRAINT interview_questions_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- question_likes.user_id
ALTER TABLE public.question_likes DROP CONSTRAINT IF EXISTS question_likes_user_id_fkey;
ALTER TABLE public.question_likes
  ADD CONSTRAINT question_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- courses.created_by
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_created_by_fkey;
ALTER TABLE public.courses
  ADD CONSTRAINT courses_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- user_sessions.user_id
ALTER TABLE public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE public.user_sessions
  ADD CONSTRAINT user_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- course_assignments.user_id
ALTER TABLE public.course_assignments DROP CONSTRAINT IF EXISTS course_assignments_user_id_fkey;
ALTER TABLE public.course_assignments
  ADD CONSTRAINT course_assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- course_assignments.assigned_by
ALTER TABLE public.course_assignments DROP CONSTRAINT IF EXISTS course_assignments_assigned_by_fkey;
ALTER TABLE public.course_assignments
  ADD CONSTRAINT course_assignments_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- user_progress.user_id
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE public.user_progress
  ADD CONSTRAINT user_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- security_audit_log.user_id
ALTER TABLE public.security_audit_log DROP CONSTRAINT IF EXISTS security_audit_log_user_id_fkey;
ALTER TABLE public.security_audit_log
  ADD CONSTRAINT security_audit_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- dropdown_options.created_by
ALTER TABLE public.dropdown_options DROP CONSTRAINT IF EXISTS dropdown_options_created_by_fkey;
ALTER TABLE public.dropdown_options
  ADD CONSTRAINT dropdown_options_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- user_stages.transitioned_by (already has user_id → profiles, but transitioned_by → auth.users)
ALTER TABLE public.user_stages DROP CONSTRAINT IF EXISTS user_stages_transitioned_by_fkey;
ALTER TABLE public.user_stages
  ADD CONSTRAINT user_stages_transitioned_by_fkey
  FOREIGN KEY (transitioned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- stage_templates.created_by
ALTER TABLE public.stage_templates DROP CONSTRAINT IF EXISTS stage_templates_created_by_fkey;
ALTER TABLE public.stage_templates
  ADD CONSTRAINT stage_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- question_thumbs_up.user_id
ALTER TABLE public.question_thumbs_up DROP CONSTRAINT IF EXISTS question_thumbs_up_user_id_fkey;
ALTER TABLE public.question_thumbs_up
  ADD CONSTRAINT question_thumbs_up_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- role_applications.applied_by
ALTER TABLE public.role_applications DROP CONSTRAINT IF EXISTS role_applications_applied_by_fkey;
ALTER TABLE public.role_applications
  ADD CONSTRAINT role_applications_applied_by_fkey
  FOREIGN KEY (applied_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Update the handle_new_user trigger to also accept clerk-created profiles.
--    During migration period, profiles can be created either by the existing
--    auth trigger or by the clerk-webhook Edge Function.
--    The existing trigger on auth.users INSERT stays — it will fire for any
--    remaining Supabase Auth signups. The clerk-webhook creates profiles
--    directly, bypassing this trigger.

-- 5. RLS policies remain unchanged.
--    Clerk JWTs will have sub = profiles.id (UUID), so auth.uid() resolves
--    correctly. The has_role() function queries profiles by UUID, unchanged.
