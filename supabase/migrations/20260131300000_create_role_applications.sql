-- Table for storing role applications
CREATE TABLE IF NOT EXISTS public.role_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_path TEXT,
  applied_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_applications_role_id ON public.role_applications(role_id);
CREATE INDEX IF NOT EXISTS idx_role_applications_created_at ON public.role_applications(created_at DESC);

ALTER TABLE public.role_applications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own applications
CREATE POLICY "Authenticated users can apply"
  ON public.role_applications FOR INSERT
  TO authenticated
  WITH CHECK (applied_by = auth.uid());

-- Admins can read all applications
CREATE POLICY "Admins can read applications"
  ON public.role_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can read their own applications
CREATE POLICY "Users can read own applications"
  ON public.role_applications FOR SELECT
  TO authenticated
  USING (applied_by = auth.uid());

-- Storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'role-applications',
  'role-applications',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users can upload CVs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'role-applications' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can read all CVs
CREATE POLICY "Admins can read CVs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'role-applications'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can read their own CVs
CREATE POLICY "Users can read own CVs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'role-applications' AND (storage.foldername(name))[1] = auth.uid()::text);
