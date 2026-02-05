-- Debug Kanban 400 Error
-- Run this SQL in your Supabase SQL Editor to diagnose the 400 error

-- 1. Check if all required tables exist
SELECT 'Checking table existence:' as status;

SELECT 
  schemaname, 
  tablename, 
  tableowner
FROM pg_tables 
WHERE tablename IN ('stages', 'user_stages', 'stage_transitions', 'user_rejections', 'profiles')
ORDER BY tablename;

-- 2. Check if stages table has data
SELECT 'Checking stages data:' as status;
SELECT id, name, order_index FROM stages ORDER BY order_index;

-- 3. Check if user_stages table has data
SELECT 'Checking user_stages data:' as status;
SELECT 
  us.id, 
  us.user_id, 
  us.stage_id, 
  us.is_current,
  p.email,
  s.name as stage_name
FROM user_stages us
LEFT JOIN profiles p ON us.user_id = p.id
LEFT JOIN stages s ON us.stage_id = s.id
ORDER BY us.created_at DESC
LIMIT 10;

-- 4. Check if profiles table has data
SELECT 'Checking profiles data:' as status;
SELECT id, email, full_name, role, total_session_time_minutes 
FROM profiles 
LIMIT 5;

-- 5. Test the function directly with a specific stage
SELECT 'Testing function with specific stage:' as status;

-- Get the first stage ID
DO $$
DECLARE
    stage_id UUID;
    result_count INTEGER;
BEGIN
    -- Get a stage ID
    SELECT id INTO stage_id FROM stages LIMIT 1;
    
    IF stage_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with stage ID: %', stage_id;
        
        -- Test the function
        SELECT COUNT(*) INTO result_count 
        FROM get_users_by_stage_with_rejected(stage_id, false);
        
        RAISE NOTICE 'Function returned % users', result_count;
    ELSE
        RAISE NOTICE 'No stages found!';
    END IF;
END $$;

-- 6. Check function signature
SELECT 'Checking function signature:' as status;
SELECT 
  proname as function_name,
  oidvectortypes(proargtypes) as parameters,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_users_by_stage_with_rejected';

-- 7. Test with all stages
SELECT 'Testing function with all stages:' as status;
SELECT 
  s.name as stage_name,
  s.id as stage_id,
  COUNT(*) as user_count
FROM stages s
LEFT JOIN get_users_by_stage_with_rejected(s.id, false) g ON true
GROUP BY s.id, s.name
ORDER BY s.order_index;

-- 8. Check for any RLS issues
SELECT 'Checking RLS policies:' as status;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('stages', 'user_stages', 'stage_transitions', 'user_rejections')
ORDER BY tablename, policyname;

SELECT 'Debug script completed.' as status;
