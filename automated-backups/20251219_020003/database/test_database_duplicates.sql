-- Test database for duplicates
-- Run this in your Supabase SQL Editor

-- 1. Check user_stages table for duplicates
SELECT 'user_stages duplicates:' as info;
SELECT user_id, stage, COUNT(*) as count
FROM user_stages 
WHERE stage = 'Interested'
GROUP BY user_id, stage
HAVING COUNT(*) > 1;

-- 2. Check all user_stages entries for Interested
SELECT 'All user_stages for Interested:' as info;
SELECT user_id, stage, created_at, updated_at
FROM user_stages 
WHERE stage = 'Interested'
ORDER BY user_id, created_at;

-- 3. Test the function directly
SELECT 'Function output:' as info;
SELECT user_id, email, full_name, role, "position"
FROM get_users_by_stage_with_rejected('Interested', FALSE)
ORDER BY email;

-- 4. Check if there are any constraints or triggers causing issues
SELECT 'Checking for any duplicate prevention:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_stages';
