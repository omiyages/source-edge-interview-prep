
-- First, delete all users with pipeline.temp emails
DELETE FROM auth.users WHERE email LIKE '%@pipeline.temp';

-- Also clean up any profiles with temp emails
DELETE FROM public.profiles WHERE email LIKE '%@pipeline.temp';

-- Now let's ensure the candidate_pipeline table has the correct structure
-- Drop the old foreign key constraint if it exists
ALTER TABLE candidate_pipeline DROP CONSTRAINT IF EXISTS candidate_pipeline_candidate_ref_id_fkey;

-- Make sure candidate_id properly references candidates table
ALTER TABLE candidate_pipeline DROP CONSTRAINT IF EXISTS candidate_pipeline_candidate_id_fkey;
ALTER TABLE candidate_pipeline ADD CONSTRAINT candidate_pipeline_candidate_id_fkey 
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;

-- Update any existing pipeline records that might have invalid candidate_ids
DELETE FROM candidate_pipeline WHERE candidate_id NOT IN (SELECT id FROM candidates);

-- Ensure candidates can exist without email (for pipeline-only candidates)
ALTER TABLE candidates ALTER COLUMN email DROP NOT NULL;
