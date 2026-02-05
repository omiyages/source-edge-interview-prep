-- Debug script to find out why kanban board is empty
-- Run this in the Supabase SQL Editor

-- 1. Check if there are any users in user_stages table
SELECT 'Checking user_stages table:' as info;
SELECT 
  stage,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_entries,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_entries
FROM public.user_stages 
GROUP BY stage
ORDER BY stage;

-- 2. Check if there are any profiles
SELECT 'Checking profiles table:' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_profiles
FROM public.profiles;

-- 3. Check the specific function call for 'Interested' stage
SELECT 'Testing function call for Interested stage:' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at,
  is_rejected
FROM public.get_users_by_stage_with_rejected('Interested', false)
LIMIT 5;

-- 4. Check if there are any user_stages with is_active = true
SELECT 'Checking active user_stages:' as info;
SELECT 
  us.user_id,
  p.email,
  p.full_name,
  us.stage,
  us.is_active,
  us.created_at,
  us.updated_at
FROM public.user_stages us
LEFT JOIN public.profiles p ON us.user_id = p.id
WHERE us.is_active = true
ORDER BY us.created_at DESC
LIMIT 10;

-- 5. Check if there are any admin_id constraints
SELECT 'Checking admin_id constraints:' as info;
SELECT 
  us.user_id,
  p.email,
  us.stage,
  us.admin_id,
  us.is_active
FROM public.user_stages us
LEFT JOIN public.profiles p ON us.user_id = p.id
WHERE us.is_active = true
ORDER BY us.created_at DESC
LIMIT 10;

-- 6. Test the function with different parameters
SELECT 'Testing function with show_rejected = true:' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at,
  is_rejected
FROM public.get_users_by_stage_with_rejected('Interested', true)
LIMIT 5;

