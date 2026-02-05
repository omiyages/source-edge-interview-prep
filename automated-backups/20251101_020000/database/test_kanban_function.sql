-- Test the kanban function to see what it returns
-- Run this in your Supabase SQL Editor

-- Test the function for Interested stage
SELECT 'Testing get_users_by_stage_with_rejected for Interested:' as info;
SELECT user_id, email, full_name, role, "position", stage_updated_at
FROM get_users_by_stage_with_rejected('Interested', FALSE)
ORDER BY email;

-- Check if there are any NULL or invalid user_ids
SELECT 'Checking for invalid user_ids:' as info;
SELECT user_id, email, full_name, role, "position"
FROM get_users_by_stage_with_rejected('Interested', FALSE)
WHERE user_id IS NULL OR user_id = '' OR email IS NULL OR email = '';

-- Check user_stages table directly
SELECT 'Direct user_stages query:' as info;
SELECT us.user_id, p.email, p.full_name, us.stage, us.updated_at
FROM user_stages us
JOIN profiles p ON us.user_id = p.id
WHERE us.stage = 'Interested'
ORDER BY p.email;