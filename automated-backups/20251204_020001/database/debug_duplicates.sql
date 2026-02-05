-- Debug duplicate users issue
-- Run this in your Supabase SQL Editor

-- 1. Check for duplicate user_stages entries
SELECT 'Checking user_stages for duplicates:' as info;
SELECT user_id, stage, COUNT(*) as count
FROM user_stages 
WHERE stage = 'Interested'
GROUP BY user_id, stage
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Check all user_stages entries for Interested stage
SELECT 'All user_stages entries for Interested:' as info;
SELECT user_id, stage, created_at, updated_at
FROM user_stages 
WHERE stage = 'Interested'
ORDER BY user_id, created_at;

-- 3. Check profiles table for duplicates
SELECT 'Checking profiles for duplicates:' as info;
SELECT id, email, full_name, COUNT(*) as count
FROM profiles 
GROUP BY id, email, full_name
HAVING COUNT(*) > 1;

-- 4. Test the current function output
SELECT 'Current function output:' as info;
SELECT user_id, email, full_name, role, "position", stage_updated_at
FROM get_users_by_stage_with_rejected('Interested', FALSE) 
ORDER BY email, stage_updated_at;

-- 5. Check if there are multiple user_stages entries for same user
SELECT 'Multiple user_stages for same user:' as info;
SELECT us.user_id, p.email, p.full_name, COUNT(*) as stage_count
FROM user_stages us
JOIN profiles p ON us.user_id = p.id
WHERE us.stage = 'Interested'
GROUP BY us.user_id, p.email, p.full_name
HAVING COUNT(*) > 1;
