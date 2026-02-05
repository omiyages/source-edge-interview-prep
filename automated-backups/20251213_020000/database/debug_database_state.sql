-- Debug Database State
-- Run this SQL in your Supabase SQL Editor to see what's in your database

-- 1. Check if user_stages table exists and has data
SELECT 'user_stages table check' as check_type;
SELECT COUNT(*) as total_records FROM user_stages;
SELECT COUNT(*) as current_records FROM user_stages WHERE is_current = true;

-- 2. Check if stages table exists and has data
SELECT 'stages table check' as check_type;
SELECT COUNT(*) as total_stages FROM stages;
SELECT id, name FROM stages ORDER BY name;

-- 3. Check if profiles table has data
SELECT 'profiles table check' as check_type;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Check user_stages with stage names
SELECT 'user_stages with stage names' as check_type;
SELECT 
  us.user_id,
  us.stage_id,
  s.name as stage_name,
  us.is_current,
  us.created_at
FROM user_stages us
LEFT JOIN stages s ON us.stage_id = s.id
WHERE us.is_current = true
ORDER BY us.created_at DESC
LIMIT 5;

-- 5. Check if any functions exist
SELECT 'functions check' as check_type;
SELECT proname as function_name
FROM pg_proc 
WHERE proname LIKE '%get_users_by_stage%';

-- 6. Test a simple query to see if basic data exists
SELECT 'basic data test' as check_type;
SELECT 
  p.id,
  p.email,
  p.full_name,
  us.stage_id,
  s.name as stage_name
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
JOIN stages s ON us.stage_id = s.id
WHERE us.is_current = true
LIMIT 3;
