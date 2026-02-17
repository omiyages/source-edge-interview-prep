-- Create the roles table for managing open positions
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  working_style TEXT NOT NULL CHECK (working_style IN ('Hybrid', 'Remote', 'Onsite')),
  division TEXT,
  job_description TEXT,
  requirements TEXT,
  nice_to_haves TEXT,
  benefits TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_roles_company ON public.roles(company);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON public.roles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roles_working_style ON public.roles(working_style);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read active roles
CREATE POLICY "Anyone can read active roles"
  ON public.roles FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Admins can read ALL roles (including draft and closed)
CREATE POLICY "Admins can read all roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update roles
CREATE POLICY "Admins can update roles"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON public.roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
