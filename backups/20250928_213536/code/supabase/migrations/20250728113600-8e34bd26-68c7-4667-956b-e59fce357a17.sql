
-- First, let's drop the incorrect foreign key constraint
ALTER TABLE candidate_pipeline DROP CONSTRAINT IF EXISTS candidate_pipeline_candidate_id_fkey;

-- Now add the correct foreign key constraint that references the candidates table
ALTER TABLE candidate_pipeline ADD CONSTRAINT candidate_pipeline_candidate_id_fkey 
    FOREIGN KEY (candidate_id) REFERENCES candidates(id);
