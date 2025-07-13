-- Add new fields to candidate_pipeline table for application tracking
ALTER TABLE candidate_pipeline 
ADD COLUMN applied_company TEXT,
ADD COLUMN applied_job_title TEXT;

-- Remove the unique constraint on candidate_id to allow multiple applications
-- First, let's check if there's a unique constraint and remove it
DO $$
BEGIN
    -- Drop the unique constraint if it exists (it might be from the foreign key or explicit constraint)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidate_pipeline_candidate_id_key' 
        AND table_name = 'candidate_pipeline'
    ) THEN
        ALTER TABLE candidate_pipeline DROP CONSTRAINT candidate_pipeline_candidate_id_key;
    END IF;
END $$;

-- Add an index for better performance on candidate_id lookups
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_candidate_id ON candidate_pipeline(candidate_id);

-- Add an index for better performance on stage_id lookups  
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_stage_id ON candidate_pipeline(stage_id);