-- Test the move_user_to_stage function
-- Run this in Supabase SQL Editor to test if the function works

-- First, let's check if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'move_user_to_stage';

-- Check if we have any users in user_stages
SELECT COUNT(*) as user_count FROM user_stages;

-- Check if we have any profiles
SELECT COUNT(*) as profile_count FROM profiles;

-- Test the function with a sample user (replace with actual user_id)
-- SELECT move_user_to_stage(
--   'your-user-id-here'::UUID,
--   'Scheduled'::VARCHAR,
--   'your-admin-id-here'::UUID,
--   'Test move'::TEXT
-- );
