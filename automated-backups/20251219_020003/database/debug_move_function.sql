-- Debug the current move_user_to_stage function
-- Run this in your Supabase SQL Editor

-- Check the current function definition
SELECT 'Current function definition:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'move_user_to_stage';

-- Check current user_stages entries
SELECT 'Current user_stages entries:' as info;
SELECT user_id, stage, created_at, updated_at
FROM user_stages 
ORDER BY user_id, stage, created_at;

-- Check stage_transitions entries
SELECT 'Recent stage_transitions:' as info;
SELECT user_id, from_stage, to_stage, transitioned_by, notes, created_at
FROM stage_transitions 
ORDER BY created_at DESC 
LIMIT 10;
