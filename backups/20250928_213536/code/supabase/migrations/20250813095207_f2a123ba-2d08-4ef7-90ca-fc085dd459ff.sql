
-- Delete all candidates from candidate_pipeline table (except those linked to admin users)
DELETE FROM candidate_pipeline 
WHERE candidate_id NOT IN (
  SELECT c.id 
  FROM candidates c 
  JOIN profiles p ON c.user_id = p.id 
  WHERE p.role = 'admin'
);

-- Delete all candidates from candidates table (except those linked to admin users)
DELETE FROM candidates 
WHERE id NOT IN (
  SELECT c.id 
  FROM candidates c 
  JOIN profiles p ON c.user_id = p.id 
  WHERE p.role = 'admin'
) AND user_id IS NOT NULL;

-- Delete all standalone candidates (those not linked to any user account)
DELETE FROM candidates 
WHERE user_id IS NULL;

-- Clean up any orphaned google_sheets_candidate_imports records
DELETE FROM google_sheets_candidate_imports;
