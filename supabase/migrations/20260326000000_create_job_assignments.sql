-- ============================================================================
-- Migration: Job Assignments feature
-- Allows admins to assign jobs to candidates; candidates can respond Yes/Interested.
-- Public access via a secure token-based link (no login required).
-- ============================================================================

-- ── 1. job_assignments ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_assignments (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id TEXT   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id     UUID    NOT NULL REFERENCES public.roles(id)    ON DELETE CASCADE,
  assigned_by TEXT    NOT NULL REFERENCES public.profiles(id),
  status      TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'interested')),
  responded_at TIMESTAMPTZ,
  notes        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_candidate ON public.job_assignments (candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_role     ON public.job_assignments (role_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status   ON public.job_assignments (status);
CREATE INDEX IF NOT EXISTS idx_job_assignments_created  ON public.job_assignments (created_at DESC);

ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage job assignments"
  ON public.job_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (auth.jwt() ->> 'sub') AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (auth.jwt() ->> 'sub') AND role = 'admin'
    )
  );

-- Candidates can read their own assignments
CREATE POLICY "Candidates can read own assignments"
  ON public.job_assignments FOR SELECT
  TO authenticated
  USING (candidate_id = (auth.jwt() ->> 'sub'));

-- Candidates can update status on their own assignments
CREATE POLICY "Candidates can respond to assignments"
  ON public.job_assignments FOR UPDATE
  TO authenticated
  USING  (candidate_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (candidate_id = (auth.jwt() ->> 'sub'));

-- ── 2. job_assignment_tokens ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_assignment_tokens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_job_assignment_tokens_token     ON public.job_assignment_tokens (token);
CREATE INDEX IF NOT EXISTS idx_job_assignment_tokens_candidate ON public.job_assignment_tokens (candidate_id);

ALTER TABLE public.job_assignment_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage tokens
CREATE POLICY "Admins can manage tokens"
  ON public.job_assignment_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (auth.jwt() ->> 'sub') AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (auth.jwt() ->> 'sub') AND role = 'admin'
    )
  );

-- Candidates can read their own token
CREATE POLICY "Candidates can read own token"
  ON public.job_assignment_tokens FOR SELECT
  TO authenticated
  USING (candidate_id = (auth.jwt() ->> 'sub'));

-- ── 3. updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_job_assignment_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_job_assignments_updated_at
  BEFORE UPDATE ON public.job_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_job_assignment_updated_at();

-- ── 4. SECURITY DEFINER RPC — read assignments via token (no login needed) ───

CREATE OR REPLACE FUNCTION public.get_assignments_by_token(p_token TEXT)
RETURNS TABLE (
  assignment_id   UUID,
  role_id         UUID,
  status          TEXT,
  responded_at    TIMESTAMPTZ,
  assigned_at     TIMESTAMPTZ,
  job_title       TEXT,
  company         TEXT,
  location        TEXT,
  working_style   TEXT,
  japanese_level  TEXT,
  division        TEXT,
  job_description TEXT,
  requirements    TEXT,
  nice_to_haves   TEXT,
  benefits        TEXT,
  ai_summary      TEXT,
  slug            TEXT,
  candidate_name  TEXT,
  candidate_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ja.id           AS assignment_id,
    r.id            AS role_id,
    ja.status,
    ja.responded_at,
    ja.created_at   AS assigned_at,
    r.job_title,
    r.company,
    r.location,
    r.working_style,
    r.japanese_level,
    r.division,
    r.job_description,
    r.requirements,
    r.nice_to_haves,
    r.benefits,
    r.ai_summary,
    r.slug,
    p.full_name     AS candidate_name,
    p.email         AS candidate_email
  FROM  public.job_assignment_tokens jat
  JOIN  public.job_assignments ja ON ja.candidate_id = jat.candidate_id
  JOIN  public.roles            r  ON r.id            = ja.role_id
  JOIN  public.profiles         p  ON p.id            = jat.candidate_id
  WHERE jat.token = p_token
    AND (jat.expires_at IS NULL OR jat.expires_at > now());
END;
$$;

-- ── 5. SECURITY DEFINER RPC — respond to assignment via token (no login) ─────

CREATE OR REPLACE FUNCTION public.respond_assignment_by_token(
  p_token         TEXT,
  p_assignment_id UUID,
  p_status        TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_status NOT IN ('pending', 'interested') THEN
    RAISE EXCEPTION 'Invalid status value: %', p_status;
  END IF;

  UPDATE public.job_assignments ja
  SET
    status       = p_status,
    responded_at = CASE WHEN p_status != 'pending' THEN now() ELSE responded_at END,
    updated_at   = now()
  FROM public.job_assignment_tokens jat
  WHERE jat.token    = p_token
    AND ja.id        = p_assignment_id
    AND ja.candidate_id = jat.candidate_id
    AND (jat.expires_at IS NULL OR jat.expires_at > now());
END;
$$;
