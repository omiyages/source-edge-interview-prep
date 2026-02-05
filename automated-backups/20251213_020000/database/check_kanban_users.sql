-- Check if there are any users in the Kanban board at all
-- This will help identify if the issue is with the function or with data

-- 1. Check if there are any user_stages entries
SELECT 'User stages entries:' as check;
SELECT COUNT(*) as total_user_stages,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(DISTINCT stage) as unique_stages
FROM user_stages 
WHERE is_active = true;

-- 2. Check what stages exist and how many users in each
SELECT 'Users per stage:' as check;
SELECT stage, COUNT(*) as user_count
FROM user_stages 
WHERE is_active = true
GROUP BY stage
ORDER BY user_count DESC;

-- 3. Check if there are any profiles at all
SELECT 'Total profiles:' as check;
SELECT COUNT(*) as total_profiles
FROM profiles;

-- 4. Check profiles with positions (these should be in Kanban)
SELECT 'Profiles with positions:' as check;
SELECT COUNT(*) as profiles_with_position
FROM profiles 
WHERE "position" IS NOT NULL AND "position" != '';

-- 5. Direct query to see users that should be in Kanban
SELECT 'Direct query - users that should be in Kanban:' as check;
SELECT p.id, p.email, p.full_name, p."position", p.company, us.stage, us.is_active
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true
ORDER BY us.updated_at DESC
LIMIT 10;

-- 6. Test if the function exists and works
SELECT 'Function test:' as check;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_stage_with_rejected';

-- 7. Try to call the function directly
SELECT 'Function call test:' as check;
SELECT * FROM get_users_by_stage_with_rejected('Interested', true) LIMIT 3;
