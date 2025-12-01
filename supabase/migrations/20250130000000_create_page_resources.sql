-- Create a table to link resources to pages
CREATE TABLE IF NOT EXISTS public.page_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_identifier TEXT NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_identifier, resource_id)
);

-- Enable Row Level Security
ALTER TABLE public.page_resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Anyone can view page resources" ON public.page_resources;
DROP POLICY IF EXISTS "Admins can manage page resources" ON public.page_resources;

-- Create policies for page_resources
CREATE POLICY "Anyone can view page resources"
  ON public.page_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage page resources"
  ON public.page_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_page_resources_page_identifier ON public.page_resources(page_identifier);
CREATE INDEX IF NOT EXISTS idx_page_resources_resource_id ON public.page_resources(resource_id);

