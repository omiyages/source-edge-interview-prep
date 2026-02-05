-- Aggressive cleanup to remove all ghost duplicates
-- Run this in your Supabase SQL Editor

-- 1. Show all current user_stages entries
SELECT 'All user_stages entries before cleanup:' as info;
SELECT user_id, stage, created_at, updated_at, 
       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
FROM user_stages 
ORDER BY user_id, updated_at DESC;

-- 2. Delete ALL user_stages entries
DELETE FROM user_stages;

-- 3. Delete ALL stage_transitions entries (they might be causing issues)
DELETE FROM stage_transitions;

-- 4. Recreate user_stages entries cleanly - only for users with positions
INSERT INTO user_stages (user_id, stage, created_at, updated_at)
SELECT DISTINCT 
    p.id as user_id,
    'Interested' as stage,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE p."position" IS NOT NULL 
  AND p."position" != ''
  AND p."position" != 'null'
  AND p."position" != 'undefined';

-- 5. Add strict unique constraint
ALTER TABLE user_stages 
DROP CONSTRAINT IF EXISTS user_stages_user_id_stage_key;

ALTER TABLE user_stages 
ADD CONSTRAINT user_stages_user_id_stage_key 
UNIQUE (user_id, stage);

-- 6. Verify cleanup
SELECT 'After cleanup - should be clean:' as info;
SELECT user_id, stage, created_at, updated_at
FROM user_stages 
ORDER BY user_id, stage;

-- 7. Check for any remaining duplicates
SELECT 'Remaining duplicates (should be 0):' as info;
SELECT user_id, stage, COUNT(*) as count
FROM user_stages 
GROUP BY user_id, stage
HAVING COUNT(*) > 1;
