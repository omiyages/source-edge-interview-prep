-- Complete fix for kanban board issues
-- Run this in the Supabase SQL Editor

-- 1. First, let's check what we have
SELECT '=== DIAGNOSTIC: Checking current state ===' as info;

-- Check user_stages
SELECT 'User stages count:' as info, COUNT(*) as count FROM public.user_stages;
SELECT 'Active user stages count:' as info, COUNT(*) as count FROM public.user_stages WHERE is_active = true;

-- Check profiles
SELECT 'Profiles count:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'User profiles count:' as info, COUNT(*) as count FROM public.profiles WHERE role = 'user';

-- 2. Fix the function signature to match frontend expectations
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(text, boolean, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(varchar, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(varchar, boolean, uuid) CASCADE;

-- Create the function with the exact signature the frontend expects
CREATE OR REPLACE FUNCTION public.get_users_by_stage_with_rejected(
  p_stage_name text,
  p_show_rejected boolean DEFAULT false
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role text,
  "position" text,
  company text,
  last_activity_at timestamptz,
  total_session_time_minutes integer,
  stage_updated_at timestamptz,
  last_updated_at timestamptz,
  upcoming_interview_name text,
  upcoming_interview_date timestamptz,
  is_rejected boolean,
  incomplete_tasks_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    COALESCE(p.full_name, '') as full_name,
    COALESCE(p.role::text, 'user') as role,
    p."position" as "position",
    p.company,
    p.last_login_at as last_activity_at,
    COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
    us.created_at as stage_updated_at,
    COALESCE(us.updated_at, us.created_at) as last_updated_at,
    i.interview_name as upcoming_interview_name,
    i.scheduled_date as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected,
    COALESCE(task_count.incomplete_tasks, 0) as incomplete_tasks_count
  FROM public.profiles p
  INNER JOIN public.user_stages us ON p.id = us.user_id
  LEFT JOIN public.user_rejections ur ON p.id = ur.user_id
  LEFT JOIN LATERAL (
    SELECT interview_name, scheduled_date
    FROM public.interviews 
    WHERE interviews.user_id = p.id 
    AND scheduled_date > NOW()
    ORDER BY scheduled_date ASC 
    LIMIT 1
  ) i ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER as incomplete_tasks
    FROM public.admin_notes 
    WHERE admin_notes.user_id = p.id 
    AND note_type = 'todo' 
    AND is_completed = FALSE
  ) task_count ON TRUE
  WHERE us.stage = p_stage_name
    AND us.is_active = true
    AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_users_by_stage_with_rejected TO authenticated;

-- 3. Add test data if user_stages is empty
DO $$
DECLARE
  user_stages_count integer;
  test_user_id uuid;
  stage_names text[] := ARRAY['Interested', 'Scheduled', 'CV Sent', '1st Interview'];
  stage_name text;
BEGIN
  -- Check if we have any user_stages
  SELECT COUNT(*) INTO user_stages_count FROM public.user_stages;
  
  IF user_stages_count = 0 THEN
    RAISE NOTICE 'No user_stages found. Adding test data...';
    
    -- Add users to different stages
    FOR stage_name IN SELECT unnest(stage_names)
    LOOP
      FOR test_user_id IN 
        SELECT id FROM public.profiles WHERE role = 'user' LIMIT 2
      LOOP
        -- Add to stage
        INSERT INTO public.user_stages (user_id, stage, is_active, created_at, updated_at)
        VALUES (test_user_id, stage_name, true, NOW(), NOW())
        ON CONFLICT (user_id, stage) DO NOTHING;
        
        RAISE NOTICE 'Added user % to % stage', test_user_id, stage_name;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Test data added successfully';
  ELSE
    RAISE NOTICE 'Found % user_stages entries, no test data needed', user_stages_count;
  END IF;
END $$;

-- 4. Test the function
SELECT '=== TESTING FUNCTION ===' as info;

-- Test with 'Interested' stage
SELECT 'Testing get_users_by_stage_with_rejected(Interested, false):' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at,
  upcoming_interview_name,
  incomplete_tasks_count
FROM public.get_users_by_stage_with_rejected('Interested', false)
LIMIT 5;

-- Test with all stages
SELECT 'Testing all stages:' as info;
SELECT 
  'Interested' as stage,
  COUNT(*) as user_count
FROM public.get_users_by_stage_with_rejected('Interested', false)
UNION ALL
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

-- 5. Final diagnostic
SELECT '=== FINAL DIAGNOSTIC ===' as info;
SELECT 
  'User stages by stage:' as info;
SELECT 
  stage,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM public.user_stages 
GROUP BY stage
ORDER BY stage;





