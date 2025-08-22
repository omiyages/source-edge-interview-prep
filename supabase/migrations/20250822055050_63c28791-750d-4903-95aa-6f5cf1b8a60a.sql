-- Create missing dropdown_options table with proper security
CREATE TABLE public.dropdown_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_name, value)
);

-- Enable RLS
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view dropdown options
CREATE POLICY "Authenticated users can view dropdown options"
ON public.dropdown_options
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can create dropdown options
CREATE POLICY "Admins can create dropdown options"
ON public.dropdown_options
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update dropdown options
CREATE POLICY "Admins can update dropdown options"
ON public.dropdown_options
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete dropdown options
CREATE POLICY "Admins can delete dropdown options"
ON public.dropdown_options
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_dropdown_options_updated_at
  BEFORE UPDATE ON public.dropdown_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Populate with existing data from interview_questions
INSERT INTO public.dropdown_options (field_name, value)
SELECT DISTINCT 'company', company
FROM public.interview_questions
WHERE company IS NOT NULL AND company != ''
ON CONFLICT (field_name, value) DO NOTHING;

INSERT INTO public.dropdown_options (field_name, value)
SELECT DISTINCT 'role', role
FROM public.interview_questions
WHERE role IS NOT NULL AND role != ''
ON CONFLICT (field_name, value) DO NOTHING;

INSERT INTO public.dropdown_options (field_name, value)
SELECT DISTINCT 'interview_stage', interview_stage
FROM public.interview_questions
WHERE interview_stage IS NOT NULL AND interview_stage != ''
ON CONFLICT (field_name, value) DO NOTHING;

INSERT INTO public.dropdown_options (field_name, value)
SELECT DISTINCT 'category', category
FROM public.interview_questions
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (field_name, value) DO NOTHING;