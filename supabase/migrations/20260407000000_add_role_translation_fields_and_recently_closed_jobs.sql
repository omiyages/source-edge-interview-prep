-- Add ATS identity + JP originals + async translation fields to roles
-- and create recently-closed retention table for BD workflow (admin-only).

ALTER TABLE public.roles
ADD COLUMN IF NOT EXISTS ats_platform TEXT,
ADD COLUMN IF NOT EXISTS ats_external_id TEXT,
ADD COLUMN IF NOT EXISTS ats_hosted_url TEXT,
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS job_title_ja TEXT,
ADD COLUMN IF NOT EXISTS job_description_ja TEXT,
ADD COLUMN IF NOT EXISTS location_ja TEXT,
ADD COLUMN IF NOT EXISTS commitment_ja TEXT,
ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (translation_status IN ('pending', 'done', 'error', 'skipped')),
ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS translation_error TEXT;

-- Dedupe identity for imported ATS jobs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_ats_identity
ON public.roles (company, ats_platform, ats_external_id)
WHERE ats_platform IS NOT NULL AND ats_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_roles_translation_status
ON public.roles (translation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_roles_last_seen_at
ON public.roles (last_seen_at DESC);

-- Recently closed jobs (kept for 3 weeks, admin-only UI)
CREATE TABLE IF NOT EXISTS public.bd_recently_closed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  company TEXT NOT NULL,
  ats_platform TEXT NOT NULL,
  ats_external_id TEXT NOT NULL,
  ats_hosted_url TEXT,
  job_title_ja TEXT,
  job_title_en TEXT,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bd_recently_closed_jobs_identity
ON public.bd_recently_closed_jobs (company, ats_platform, ats_external_id);

CREATE INDEX IF NOT EXISTS idx_bd_recently_closed_jobs_company_closed_at
ON public.bd_recently_closed_jobs (company, closed_at DESC);

ALTER TABLE public.bd_recently_closed_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bd_recently_closed_jobs"
  ON public.bd_recently_closed_jobs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admins can insert bd_recently_closed_jobs"
  ON public.bd_recently_closed_jobs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admins can update bd_recently_closed_jobs"
  ON public.bd_recently_closed_jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admins can delete bd_recently_closed_jobs"
  ON public.bd_recently_closed_jobs FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

