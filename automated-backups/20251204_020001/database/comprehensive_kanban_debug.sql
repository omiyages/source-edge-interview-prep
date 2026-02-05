-- Comprehensive diagnostic script for empty kanban board
-- Run this in the Supabase SQL Editor to identify the issue

-- 1. Check if user_stages table exists and has data
SELECT '=== USER_STAGES TABLE ===' as section;
SELECT 
  'Total user_stages entries:' as info,
  COUNT(*) as count
FROM public.user_stages;

SELECT 
  'Active user_stages entries:' as info,
  COUNT(*) as count
FROM public.user_stages 
WHERE is_active = true;

SELECT 
  'User_stages by stage:' as info;
SELECT 
  stage,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM public.user_stages 
GROUP BY stage
ORDER BY stage;

-- 2. Check profiles table
SELECT '=== PROFILES TABLE ===' as section;
SELECT 
  'Total profiles:' as info,
  COUNT(*) as count
FROM public.profiles;

SELECT 
  'Profiles by role:' as info;
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role;

-- 3. Check if there are any joins working
SELECT '=== JOIN TEST ===' as section;
SELECT 
  'Profiles with user_stages:' as info,
  COUNT(*) as count
FROM public.profiles p
INNER JOIN public.user_stages us ON p.id = us.user_id;

SELECT 
  'Active profiles with user_stages:' as info,
  COUNT(*) as count
FROM public.profiles p
INNER JOIN public.user_stages us ON p.id = us.user_id
WHERE us.is_active = true;

-- 4. Test the function directly with different parameters
SELECT '=== FUNCTION TESTS ===' as section;

-- Test with 'Interested' stage
SELECT 'Testing get_users_by_stage_with_rejected(Interested, false):' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at
FROM public.get_users_by_stage_with_rejected('Interested', false)
LIMIT 5;

-- Test with show_rejected = true
SELECT 'Testing get_users_by_stage_with_rejected(Interested, true):' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at
FROM public.get_users_by_stage_with_rejected('Interested', true)
LIMIT 5;

-- Test with different stages
SELECT 'Testing all stages:' as info;
SELECT 
  'Scheduled' as stage,
  COUNT(*) as user_count
FROM public.get_users_by_stage_with_rejected('Scheduled', false)
UNION ALL
SELECT 
  'CV Sent' as stage,
  COUNT(*) as user_count
FROM public.get_users_by_stage_with_rejected('CV Sent', false)
UNION ALL
SELECT 
  '1st Interview' as stage,
  COUNT(*) as user_count
FROM public.get_users_by_stage_with_rejected('1st Interview', false);

-- 5. Check if there are any user_rejections affecting the results
SELECT '=== USER_REJECTIONS ===' as section;
SELECT 
  'Total rejections:' as info,
  COUNT(*) as count
FROM public.user_rejections;

SELECT 
  'Recent rejections:' as info;
SELECT 
  ur.user_id,
  p.email,
  ur.rejected_at,
  ur.reason
FROM public.user_rejections ur
LEFT JOIN public.profiles p ON ur.user_id = p.id
ORDER BY ur.rejected_at DESC
LIMIT 5;

-- 6. Check the exact query that should work
SELECT '=== MANUAL QUERY TEST ===' as section;
SELECT 
  'Manual query for Interested stage:' as info;
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  us.stage,
  us.is_active,
  us.created_at as stage_updated_at
FROM public.profiles p
INNER JOIN public.user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested'
  AND us.is_active = true
ORDER BY us.created_at DESC
LIMIT 5;





