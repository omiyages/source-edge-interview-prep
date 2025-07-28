
-- Update existing hiring stages names
UPDATE hiring_stages 
SET name = 'Interview 1', updated_at = now()
WHERE name = '1st Interview';

UPDATE hiring_stages 
SET name = 'Interview 2', updated_at = now()
WHERE name = '2nd Interview';

UPDATE hiring_stages 
SET name = 'Interview 3+', updated_at = now()
WHERE name = '3rd Interview';

-- Remove Final Interview stage
DELETE FROM hiring_stages 
WHERE name = 'Final Interview';

-- Update stage orders to fill any gaps
UPDATE hiring_stages 
SET stage_order = 
  CASE 
    WHEN stage_order > (SELECT stage_order FROM hiring_stages WHERE name = 'Final Interview' LIMIT 1) 
    THEN stage_order - 1
    ELSE stage_order
  END,
  updated_at = now()
WHERE stage_order > (SELECT COALESCE(MAX(stage_order), 0) FROM hiring_stages WHERE name = 'Final Interview');
