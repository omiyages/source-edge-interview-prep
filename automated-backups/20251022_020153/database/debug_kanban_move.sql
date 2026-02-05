-- Debug Kanban Move Function
-- Run this in Supabase SQL Editor to check the function

-- 1. Check if the function exists
SELECT 
  routine_name, 
  routine_type,
  data_type,
  parameter_name,
  parameter_mode
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE routine_name = 'move_user_to_stage'
ORDER BY ordinal_position;

-- 2. Check current user authentication
SELECT auth.uid() as current_user_id;

-- 3. Check if we have admin users
SELECT id, email, role FROM profiles WHERE role = 'admin' LIMIT 5;

-- 4. Check if user_stages table has data
SELECT COUNT(*) as total_stages FROM user_stages;
SELECT stage, COUNT(*) as user_count FROM user_stages WHERE is_active = true GROUP BY stage;

-- 5. Test the function with a simple call (replace with actual IDs)
-- This will help identify if the issue is with the function or the parameters
-- SELECT move_user_to_stage(
--   '00000000-0000-0000-0000-000000000000'::UUID,
--   'Test'::VARCHAR,
--   '00000000-0000-0000-0000-000000000000'::UUID,
--   'Debug test'::TEXT
-- );
