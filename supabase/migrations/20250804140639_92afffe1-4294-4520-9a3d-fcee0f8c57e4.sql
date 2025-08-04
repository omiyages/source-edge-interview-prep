-- Clean up candidates with @pipeline.temp emails
-- First remove them from candidate_pipeline
DELETE FROM candidate_pipeline 
WHERE candidate_id IN (
  SELECT id FROM candidates 
  WHERE email LIKE '%@pipeline.temp%'
);

-- Then delete the candidates themselves
DELETE FROM candidates 
WHERE email LIKE '%@pipeline.temp%';

-- Also clean up any profiles with @pipeline.temp emails
DELETE FROM profiles 
WHERE email LIKE '%@pipeline.temp%';