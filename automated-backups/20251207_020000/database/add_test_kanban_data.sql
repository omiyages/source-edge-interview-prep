-- Add test data to kanban board if it's empty
-- Run this in the Supabase SQL Editor

-- First, let's check what we have
SELECT 'Before adding test data:' as info;
SELECT 
  'User stages count:' as info,
  COUNT(*) as count
FROM public.user_stages;

-- Add some test users to different stages if user_stages is empty
DO $$
DECLARE
  user_stages_count integer;
  test_user_id uuid;
BEGIN
  -- Check if we have any user_stages
  SELECT COUNT(*) INTO user_stages_count FROM public.user_stages;
  
  IF user_stages_count = 0 THEN
    RAISE NOTICE 'No user_stages found. Adding test data...';
    
    -- Get the first few user profiles
    FOR test_user_id IN 
      SELECT id FROM public.profiles WHERE role = 'user' LIMIT 5
    LOOP
      -- Add to 'Interested' stage
      INSERT INTO public.user_stages (user_id, stage, is_active, created_at, updated_at)
      VALUES (test_user_id, 'Interested', true, NOW(), NOW())
      ON CONFLICT (user_id, stage) DO NOTHING;
      
      RAISE NOTICE 'Added user % to Interested stage', test_user_id;
    END LOOP;
    
    -- Add some users to other stages
    FOR test_user_id IN 
      SELECT id FROM public.profiles WHERE role = 'user' LIMIT 3 OFFSET 5
    LOOP
      -- Add to 'Scheduled' stage
      INSERT INTO public.user_stages (user_id, stage, is_active, created_at, updated_at)
      VALUES (test_user_id, 'Scheduled', true, NOW(), NOW())
      ON CONFLICT (user_id, stage) DO NOTHING;
      
      RAISE NOTICE 'Added user % to Scheduled stage', test_user_id;
    END LOOP;
    
    RAISE NOTICE 'Test data added successfully';
  ELSE
    RAISE NOTICE 'Found % user_stages entries, no test data needed', user_stages_count;
  END IF;
END $$;

-- Check the results
SELECT 'After adding test data:' as info;
SELECT 
  'User stages count:' as info,
  COUNT(*) as count
FROM public.user_stages;

SELECT 
  'User stages by stage:' as info;
SELECT 
  stage,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM public.user_stages 
GROUP BY stage
ORDER BY stage;

-- Test the function again
SELECT 'Testing function after adding data:' as info;
SELECT 
  user_id,
  email,
  full_name,
  stage_updated_at
FROM public.get_users_by_stage_with_rejected('Interested', false)
LIMIT 5;





