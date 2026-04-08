-- Fix BD helper tables for Clerk auth + HERP platform support
-- - bd_companies: allow 'herp' in ats_platform, and use clerk_uid() (text) for admin checks
-- - bd_company_jobs: use clerk_uid() (text) for admin checks

-- 1) bd_companies: allow HERP
ALTER TABLE public.bd_companies
  DROP CONSTRAINT IF EXISTS bd_companies_ats_platform_check;

ALTER TABLE public.bd_companies
  ADD CONSTRAINT bd_companies_ats_platform_check
  CHECK (
    ats_platform IS NULL
    OR ats_platform IN ('lever', 'greenhouse', 'workable', 'teamtailor', 'hrmos', 'herp')
  );

-- 2) bd_companies: RLS policies should use Clerk sub (text)
DROP POLICY IF EXISTS "Admins can read bd_companies" ON public.bd_companies;
DROP POLICY IF EXISTS "Admins can insert bd_companies" ON public.bd_companies;
DROP POLICY IF EXISTS "Admins can update bd_companies" ON public.bd_companies;
DROP POLICY IF EXISTS "Admins can delete bd_companies" ON public.bd_companies;

CREATE POLICY "Admins can read bd_companies"
  ON public.bd_companies FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert bd_companies"
  ON public.bd_companies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update bd_companies"
  ON public.bd_companies FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete bd_companies"
  ON public.bd_companies FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

-- 3) bd_company_jobs: RLS policies should use Clerk sub (text)
DROP POLICY IF EXISTS "Admins can read bd_company_jobs" ON public.bd_company_jobs;
DROP POLICY IF EXISTS "Admins can insert bd_company_jobs" ON public.bd_company_jobs;
DROP POLICY IF EXISTS "Admins can update bd_company_jobs" ON public.bd_company_jobs;
DROP POLICY IF EXISTS "Admins can delete bd_company_jobs" ON public.bd_company_jobs;

CREATE POLICY "Admins can read bd_company_jobs"
  ON public.bd_company_jobs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert bd_company_jobs"
  ON public.bd_company_jobs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update bd_company_jobs"
  ON public.bd_company_jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete bd_company_jobs"
  ON public.bd_company_jobs FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = clerk_uid() AND role = 'admin')
  );

