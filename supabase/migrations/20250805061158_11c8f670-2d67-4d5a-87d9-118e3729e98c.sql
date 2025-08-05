-- Fix foreign key constraint - candidate_pipeline should reference candidates table, not profiles
ALTER TABLE public.candidate_pipeline 
DROP CONSTRAINT IF EXISTS candidate_pipeline_candidate_id_fkey;

-- Add correct foreign key constraint to candidates table
ALTER TABLE public.candidate_pipeline 
ADD CONSTRAINT candidate_pipeline_candidate_id_fkey 
FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;