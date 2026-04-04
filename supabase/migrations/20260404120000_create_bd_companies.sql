-- Target companies for BD helper: careers URLs, ATS metadata, parsed job counts (admin-only)

CREATE TABLE public.bd_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  careers_url TEXT NOT NULL,
  ats_platform TEXT CHECK (
    ats_platform IS NULL
    OR ats_platform IN ('lever', 'greenhouse', 'workable', 'teamtailor', 'hrmos')
  ),
  jobs_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'error')),
  last_parsed_at TIMESTAMPTZ,
  parse_error TEXT,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_bd_companies_status ON public.bd_companies (status);
CREATE INDEX idx_bd_companies_name ON public.bd_companies (name);

ALTER TABLE public.bd_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bd_companies"
  ON public.bd_companies FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert bd_companies"
  ON public.bd_companies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update bd_companies"
  ON public.bd_companies FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete bd_companies"
  ON public.bd_companies FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_bd_companies_updated_at ON public.bd_companies;
CREATE TRIGGER update_bd_companies_updated_at
  BEFORE UPDATE ON public.bd_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.bd_companies IS 'Admin BD pipeline: job board URLs and last ATS parse stats';
