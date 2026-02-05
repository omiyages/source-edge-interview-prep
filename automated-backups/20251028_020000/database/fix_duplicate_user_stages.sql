-- Fix duplicate user_stages entries and unique constraint violation
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what duplicates exist
SELECT 'Current duplicates in user_stages:' as info;
SELECT user_id, stage, COUNT(*) as count
FROM user_stages 
GROUP BY user_id, stage
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Show all user_stages entries for debugging
SELECT 'All user_stages entries:' as info;
SELECT user_id, stage, created_at, updated_at
FROM user_stages 
ORDER BY user_id, stage, created_at;

-- 3. Delete ALL user_stages entries (we'll recreate them cleanly)
DELETE FROM user_stages;

-- 4. Recreate user_stages entries properly (one per user per stage)
-- Get all users who should be in the Kanban system
INSERT INTO user_stages (user_id, stage, created_at, updated_at)
SELECT DISTINCT 
    p.id as user_id,
    'Interested' as stage,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE p.id IN (
    -- Get users who have been added to Kanban (have any user_stages history)
    SELECT DISTINCT user_id FROM user_stages
    UNION
    -- Or get users who have positions assigned (indicating they're candidates)
    SELECT DISTINCT id FROM profiles WHERE "position" IS NOT NULL AND "position" != ''
);

-- 5. Add unique constraint to prevent future duplicates
ALTER TABLE user_stages 
ADD CONSTRAINT IF NOT EXISTS user_stages_user_id_stage_unique 
UNIQUE (user_id, stage);

-- 6. Test the function
SELECT 'Testing function after cleanup:' as info;
SELECT user_id, email, full_name, role, "position", stage_updated_at
FROM get_users_by_stage_with_rejected('Interested', FALSE)
ORDER BY email;
