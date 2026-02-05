-- Test script to verify kanban board conditional coloring is working
-- Run this in the Supabase SQL Editor after applying the fix

-- 1. Test the function with a specific stage
SELECT 'Testing get_users_by_stage_with_rejected function:' as info;

-- Test with 'Interested' stage
SELECT 
  user_id,
  email,
  full_name,
  "position",
  upcoming_interview_name,
  upcoming_interview_date,
  incomplete_tasks_count,
  is_rejected
FROM public.get_users_by_stage_with_rejected('Interested', false)
LIMIT 5;

-- 2. Check if we have any interviews data
SELECT 'Checking interviews table:' as info;
SELECT 
  user_id,
  interview_name,
  scheduled_date,
  created_at
FROM public.interviews 
WHERE scheduled_date > NOW()
ORDER BY scheduled_date ASC
LIMIT 5;

-- 3. Check if we have any incomplete tasks
SELECT 'Checking incomplete tasks:' as info;
SELECT 
  user_id,
  COUNT(*) as incomplete_tasks
FROM public.admin_notes 
WHERE note_type = 'todo' 
AND is_completed = FALSE
GROUP BY user_id
ORDER BY incomplete_tasks DESC
LIMIT 5;

-- 4. Test the function with all stages to see the data
SELECT 'Testing all stages:' as info;
SELECT 
  'Interested' as stage,
  COUNT(*) as total_users,
  COUNT(CASE WHEN upcoming_interview_name IS NOT NULL THEN 1 END) as users_with_interviews,
  COUNT(CASE WHEN incomplete_tasks_count > 0 THEN 1 END) as users_with_tasks
FROM public.get_users_by_stage_with_rejected('Interested', false)

UNION ALL

SELECT 
  'Scheduled' as stage,
  COUNT(*) as total_users,
  COUNT(CASE WHEN upcoming_interview_name IS NOT NULL THEN 1 END) as users_with_interviews,
  COUNT(CASE WHEN incomplete_tasks_count > 0 THEN 1 END) as users_with_tasks
FROM public.get_users_by_stage_with_rejected('Scheduled', false)

UNION ALL

SELECT 
  'CV Sent' as stage,
  COUNT(*) as total_users,
  COUNT(CASE WHEN upcoming_interview_name IS NOT NULL THEN 1 END) as users_with_interviews,
  COUNT(CASE WHEN incomplete_tasks_count > 0 THEN 1 END) as users_with_tasks
FROM public.get_users_by_stage_with_rejected('CV Sent', false);
