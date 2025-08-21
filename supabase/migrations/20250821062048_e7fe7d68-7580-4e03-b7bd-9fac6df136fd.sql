
-- Create a table to store custom dropdown options
CREATE TABLE public.dropdown_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL, -- 'company', 'role', 'category', 'interview_stage'
  value TEXT NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_name, value) -- Prevent duplicates
);

-- Add Row Level Security (RLS)
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view dropdown options" 
  ON public.dropdown_options 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can create dropdown options" 
  ON public.dropdown_options 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage dropdown options" 
  ON public.dropdown_options 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert existing values from interview_questions table to populate the dropdown_options table
INSERT INTO public.dropdown_options (field_name, value, created_by)
SELECT DISTINCT 'company', company, auth.uid()
FROM public.interview_questions 
WHERE company IS NOT NULL AND company != ''
ON CONFLICT (field_name, value) DO NOTHING;

INSERT INTO public.dropdown_options (field_name, value, created_by)
SELECT DISTINCT 'role', role, auth.uid()
FROM public.interview_questions 
WHERE role IS NOT NULL AND role != ''
ON CONFLICT (field_name, value) DO NOTHING;

INSERT INTO public.dropdown_options (field_name, value, created_by)
SELECT DISTINCT 'category', category, auth.uid()
FROM public.interview_questions 
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (field_name, value) DO NOTHING;

INSERT INTO public.dropdown_options (field_name, value, created_by)
SELECT DISTINCT 'interview_stage', interview_stage, auth.uid()
FROM public.interview_questions 
WHERE interview_stage IS NOT NULL AND interview_stage != ''
ON CONFLICT (field_name, value) DO NOTHING;
