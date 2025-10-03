
-- Add is_active column to candidate_pipeline table
ALTER TABLE candidate_pipeline 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add index for better performance when filtering active candidates
CREATE INDEX idx_candidate_pipeline_active ON candidate_pipeline(is_active);
