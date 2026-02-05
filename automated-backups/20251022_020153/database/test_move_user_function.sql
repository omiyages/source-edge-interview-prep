-- Test script to verify move_user_to_stage function works
-- Run this after applying the fix to verify the function is working

-- First, let's see what functions exist
SELECT 
    routine_name,
    routine_type,
    data_type,
    parameter_name,
    parameter_mode,
    ordinal_position
FROM information_schema.routines 
LEFT JOIN information_schema.parameters 
    ON routines.specific_name = parameters.specific_name
WHERE routine_name = 'move_user_to_stage'
ORDER BY routine_name, ordinal_position;

-- Test with a dummy user (replace with a real user ID if needed)
-- This will help verify the function signature is correct
SELECT move_user_to_stage(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'Interested',
  '00000000-0000-0000-0000-000000000000'::UUID,
  'Test function call'
);
