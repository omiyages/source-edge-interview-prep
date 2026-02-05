-- Clean up duplicates created by faulty move function
-- Run this in your Supabase SQL Editor

-- 1. Show current duplicates
SELECT 'Current duplicates in user_stages:' as info;
SELECT user_id, stage, COUNT(*) as count, 
       MIN(created_at) as first_created, 
       MAX(created_at) as last_created
FROM user_stages 
GROUP BY user_id, stage
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Keep only the latest entry for each user-stage combination
WITH duplicate_cleanup AS (
    SELECT user_id, stage, 
           ROW_NUMBER() OVER (PARTITION BY user_id, stage ORDER BY updated_at DESC) as rn
    FROM user_stages
)
DELETE FROM user_stages 
WHERE (user_id, stage) IN (
    SELECT user_id, stage 
    FROM duplicate_cleanup 
    WHERE rn > 1
);

-- 3. Verify cleanup worked
SELECT 'After cleanup - remaining entries:' as info;
SELECT user_id, stage, created_at, updated_at
FROM user_stages 
ORDER BY user_id, stage, created_at;

-- 4. Check for any remaining duplicates
SELECT 'Remaining duplicates (should be 0):' as info;
SELECT user_id, stage, COUNT(*) as count
FROM user_stages 
GROUP BY user_id, stage
HAVING COUNT(*) > 1;
