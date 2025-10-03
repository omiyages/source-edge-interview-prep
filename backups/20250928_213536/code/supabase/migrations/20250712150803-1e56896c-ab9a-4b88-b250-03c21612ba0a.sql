-- Add new candidate fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS past_companies TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skillsets TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary INTEGER;

-- Create hiring_stages table for Kanban pipeline
CREATE TABLE IF NOT EXISTS public.hiring_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate_pipeline table to track candidate positions
CREATE TABLE IF NOT EXISTS public.candidate_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.hiring_stages(id) ON DELETE CASCADE,
  moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  moved_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id)
);

-- Insert default hiring stages
INSERT INTO public.hiring_stages (name, stage_order, color) VALUES
  ('Scheduled a Call', 1, '#ef4444'),
  ('CV Sent', 2, '#f97316'),
  ('1st Interview', 3, '#eab308'),
  ('2nd Interview', 4, '#84cc16'),
  ('3rd Interview', 5, '#22c55e'),
  ('Final Interview', 6, '#06b6d4'),
  ('Offer', 7, '#8b5cf6'),
  ('Offer Accepted', 8, '#10b981')
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.hiring_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hiring_stages
CREATE POLICY "Admins can manage hiring stages" 
ON public.hiring_stages 
FOR ALL 
USING ((get_current_user_role())::app_role = 'admin'::app_role);

CREATE POLICY "Everyone can view hiring stages" 
ON public.hiring_stages 
FOR SELECT 
USING (true);

-- RLS Policies for candidate_pipeline
CREATE POLICY "Admins can manage candidate pipeline" 
ON public.candidate_pipeline 
FOR ALL 
USING ((get_current_user_role())::app_role = 'admin'::app_role);

CREATE POLICY "Users can view their own pipeline status" 
ON public.candidate_pipeline 
FOR SELECT 
USING (candidate_id = auth.uid() OR (get_current_user_role())::app_role = 'admin'::app_role);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_hiring_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hiring_stages_updated_at
BEFORE UPDATE ON public.hiring_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_hiring_stages_updated_at();