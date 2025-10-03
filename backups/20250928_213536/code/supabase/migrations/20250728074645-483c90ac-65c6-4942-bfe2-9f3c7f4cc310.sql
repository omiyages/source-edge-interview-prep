
-- Make candidate_id nullable in candidate_pipeline table since we're using candidate_ref_id for new candidates
ALTER TABLE public.candidate_pipeline 
ALTER COLUMN candidate_id DROP NOT NULL;

-- Add a check constraint to ensure either candidate_id or candidate_ref_id is provided
ALTER TABLE public.candidate_pipeline 
ADD CONSTRAINT candidate_pipeline_candidate_check 
CHECK (candidate_id IS NOT NULL OR candidate_ref_id IS NOT NULL);
