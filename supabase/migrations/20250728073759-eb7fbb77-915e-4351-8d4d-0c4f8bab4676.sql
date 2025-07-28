
-- First, let's clean up the existing synced candidates from profiles and pipeline
DELETE FROM candidate_pipeline WHERE candidate_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@noemail.local'
);

DELETE FROM profiles WHERE email LIKE '%@noemail.local';

-- Create a separate candidates table that doesn't require authentication
CREATE TABLE public.candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NULL,
  full_name text NULL,
  linkedin_profile text NULL,
  current_company text NULL,
  years_of_experience integer NULL,
  skillsets text[] NULL,
  phone_number text NULL,
  salary integer NULL,
  past_companies text[] NULL,
  general_notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_user boolean NOT NULL DEFAULT false,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on candidates table
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create policies for candidates table
CREATE POLICY "Admins can manage all candidates" 
  ON public.candidates 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view candidates" 
  ON public.candidates 
  FOR SELECT 
  USING (true);

-- Update candidate_pipeline to reference candidates table instead of profiles
ALTER TABLE public.candidate_pipeline 
  ADD COLUMN candidate_ref_id uuid REFERENCES public.candidates(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_candidates_email ON public.candidates(email);
CREATE INDEX idx_candidates_is_user ON public.candidates(is_user);
CREATE INDEX idx_candidate_pipeline_candidate_ref ON public.candidate_pipeline(candidate_ref_id);
