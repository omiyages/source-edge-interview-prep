-- Debug Kanban Issue - Run these queries one by one in Supabase SQL Editor

-- 1. Check if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_stage';

-- 2. Check if user_stages table has data
SELECT COUNT(*) as total_user_stages FROM user_stages;
SELECT stage, COUNT(*) as user_count FROM user_stages WHERE is_active = true GROUP BY stage;

-- 3. Check if profiles table has data
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT id, email, full_name, role, position FROM profiles LIMIT 5;

-- 4. Check if user_rejections table exists and has data
SELECT COUNT(*) as total_rejections FROM user_rejections;

-- 5. Test the function manually with a specific stage
SELECT * FROM get_users_by_stage('Interested');

-- 6. Check if there are any users in the 'Interested' stage specifically
SELECT 
  p.id,
  p.email,
  p.full_name,
  COALESCE(p.position, p.role::text) as role,
  us.stage,
  us.is_active
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested' AND us.is_active = true;

-- 7. Check if there are any RLS policies blocking access
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_stages', 'profiles', 'user_rejections');
