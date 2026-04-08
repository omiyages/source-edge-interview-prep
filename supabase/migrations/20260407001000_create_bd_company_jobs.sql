-- Persist parsed job board listings for the BD helper (admin-only).
-- This allows the Jobs tab to survive page refresh and enables an explicit AI-translation step.
--
-- NOTE: This migration is written to be safe even if `bd_company_jobs` already exists
-- (e.g. created manually or by an earlier experiment).

CREATE TABLE IF NOT EXISTS public.bd_company_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bd_company_jobs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS ats_platform TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS hosted_url TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description_plain TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS team TEXT,
ADD COLUMN IF NOT EXISTS commitment TEXT,
ADD COLUMN IF NOT EXISTS workplace_type TEXT,
ADD COLUMN IF NOT EXISTS japanese_level TEXT,
ADD COLUMN IF NOT EXISTS role_category TEXT,
ADD COLUMN IF NOT EXISTS tech_stack TEXT,
ADD COLUMN IF NOT EXISTS title_ja TEXT,
ADD COLUMN IF NOT EXISTS description_plain_ja TEXT,
ADD COLUMN IF NOT EXISTS location_ja TEXT,
ADD COLUMN IF NOT EXISTS commitment_ja TEXT,
ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS translation_error TEXT,
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.bd_company_jobs
DROP CONSTRAINT IF EXISTS bd_company_jobs_translation_status_check;

ALTER TABLE public.bd_company_jobs
ADD CONSTRAINT bd_company_jobs_translation_status_check
CHECK (translation_status IN ('pending', 'done', 'error', 'skipped'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_bd_company_jobs_identity
ON public.bd_company_jobs (company, ats_platform, external_id);

CREATE INDEX IF NOT EXISTS idx_bd_company_jobs_company_open
ON public.bd_company_jobs (company, is_open, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_bd_company_jobs_translation_status
ON public.bd_company_jobs (translation_status, updated_at DESC);

DROP TRIGGER IF EXISTS update_bd_company_jobs_updated_at ON public.bd_company_jobs;
CREATE TRIGGER update_bd_company_jobs_updated_at
  BEFORE UPDATE ON public.bd_company_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bd_company_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bd_company_jobs"
  ON public.bd_company_jobs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admins can insert bd_company_jobs"
  ON public.bd_company_jobs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admins can update bd_company_jobs"
  ON public.bd_company_jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admins can delete bd_company_jobs"
  ON public.bd_company_jobs FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

COMMENT ON TABLE public.bd_company_jobs IS 'Admin BD pipeline: persisted parsed job board listings (for refresh + AI translate step)';

