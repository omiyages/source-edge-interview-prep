-- Debug script to check why users are not showing up on Kanban board

-- 1. Check if profiles table has company column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'company';

-- 2. Check if get_users_by_stage_with_rejected function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_stage_with_rejected';

-- 3. Check if there are any users in user_stages
SELECT COUNT(*) as total_user_stages,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(DISTINCT stage) as unique_stages
FROM user_stages 
WHERE is_active = true;

-- 4. Check what stages exist
SELECT stage, COUNT(*) as user_count
FROM user_stages 
WHERE is_active = true
GROUP BY stage
ORDER BY user_count DESC;

-- 5. Test the function directly
SELECT * FROM get_users_by_stage_with_rejected('Interested', true) LIMIT 5;

-- 6. Check if there are any profiles
SELECT COUNT(*) as total_profiles,
       COUNT(CASE WHEN "position" IS NOT NULL THEN 1 END) as profiles_with_position
FROM profiles;

-- 7. Check for any errors in the function by testing with a simple query
SELECT p.id, p.email, p.full_name, p."position", p.company
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested' 
AND us.is_active = true
LIMIT 5;