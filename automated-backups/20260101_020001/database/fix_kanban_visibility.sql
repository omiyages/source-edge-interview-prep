-- Fix Kanban visibility issues
-- This script ensures users are properly visible on the Kanban board

-- 1. First, let's check if we have any users in user_stages
-- If not, we need to add them to the 'Interested' stage

-- Add all existing profiles to the 'Interested' stage if they're not already there
INSERT INTO user_stages (user_id, stage, is_current, transitioned_by, notes)
SELECT 
  p.id,
  'Interested',
  true,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  'Initial stage assignment'
FROM profiles p
WHERE p.id NOT IN (
  SELECT user_id FROM user_stages WHERE is_current = true
);

-- 2. Ensure all existing user_stages records have is_current = true
UPDATE user_stages 
SET is_current = true 
WHERE is_current IS NULL OR is_current = false;

-- 3. If there are multiple current stages for the same user, keep only the most recent one
WITH ranked_stages AS (
  SELECT 
    user_id,
    stage,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_stages
  WHERE is_current = true
)
UPDATE user_stages 
SET is_current = false
WHERE (user_id, stage) IN (
  SELECT user_id, stage 
  FROM ranked_stages 
  WHERE rn > 1
);

-- 4. Test the function to make sure it works
SELECT 'Testing get_users_by_stage_with_rejected function:' as info;
SELECT * FROM get_users_by_stage_with_rejected('Interested', false) LIMIT 5;
