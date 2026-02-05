-- Check and fix kanban data issues
-- Run this in the Supabase SQL Editor

-- 1. First, let's see what's in the user_stages table
SELECT 'Current user_stages data:' as info;
SELECT 
  us.user_id,
  p.email,
  p.full_name,
  us.stage,
  us.is_active,
  us.admin_id,
  us.created_at
FROM public.user_stages us
LEFT JOIN public.profiles p ON us.user_id = p.id
ORDER BY us.created_at DESC
LIMIT 10;

-- 2. Check if there are any profiles that could be added to kanban
SELECT 'Available profiles:' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  "position",
  created_at
FROM public.profiles
WHERE role = 'user'
ORDER BY created_at DESC
LIMIT 10;

-- 3. If no user_stages exist, let's add some test data
-- First check if we have any user_stages at all
DO $$
DECLARE
  user_stages_count integer;
BEGIN
  SELECT COUNT(*) INTO user_stages_count FROM public.user_stages;
  
  IF user_stages_count = 0 THEN
    RAISE NOTICE 'No user_stages found. Adding some test data...';
    
    -- Add some test users to the 'Interested' stage
    INSERT INTO public.user_stages (user_id, stage, is_active, created_at, updated_at)
    SELECT 
      p.id,
      'Interested',
      true,
      NOW(),
      NOW()
    FROM public.profiles p
    WHERE p.role = 'user'
    LIMIT 5;
    
    RAISE NOTICE 'Added test data to user_stages table';
  ELSE
    RAISE NOTICE 'Found % user_stages entries', user_stages_count;
  END IF;
END $$;

-- 4. Check the results after potential fix
SELECT 'After potential fix - user_stages data:' as info;
SELECT 
  us.user_id,
  p.email,
  p.full_name,
  us.stage,
  us.is_active,
  us.admin_id,
  us.created_at
FROM public.user_stages us
LEFT JOIN public.profiles p ON us.user_id = p.id
WHERE us.is_active = true
ORDER BY us.created_at DESC
LIMIT 10;

-- 5. Test the function again
SELECT 'Testing function after fix:' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at,
  is_rejected
FROM public.get_users_by_stage_with_rejected('Interested', false)
LIMIT 5;

