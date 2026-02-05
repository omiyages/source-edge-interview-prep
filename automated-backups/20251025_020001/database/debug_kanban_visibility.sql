-- Debug script to check why users are not visible on Kanban board

-- 1. Check if user_stages table has data
SELECT 'user_stages table data:' as info;
SELECT * FROM user_stages ORDER BY created_at DESC LIMIT 10;

-- 2. Check if profiles table has users
SELECT 'profiles table data:' as info;
SELECT id, email, full_name, role, position FROM profiles ORDER BY created_at DESC LIMIT 10;

-- 3. Check if the get_users_by_stage_with_rejected function exists
SELECT 'Function exists check:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_stage_with_rejected';

-- 4. Check if there are any users in the Interested stage
SELECT 'Direct query for Interested stage:' as info;
SELECT 
  p.id, 
  p.email, 
  p.full_name, 
  us.stage, 
  us.is_current,
  us.created_at
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested' 
AND us.is_current = true
ORDER BY us.created_at DESC;

-- 5. Check if there are any user_stages records at all
SELECT 'All user_stages records:' as info;
SELECT COUNT(*) as total_records FROM user_stages;

-- 6. Check if there are any profiles
SELECT 'All profiles count:' as info;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 7. Check interviews table structure
SELECT 'Interviews table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'interviews';

-- 8. Check if interviews table has data
SELECT 'Interviews table data:' as info;
SELECT * FROM interviews LIMIT 5;