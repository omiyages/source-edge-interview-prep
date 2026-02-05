-- Simple test to check for duplicates
-- Run this in your Supabase SQL Editor

-- Check if there are multiple user_stages entries for the same user
SELECT 
    us.user_id,
    p.email,
    p.full_name,
    us.stage,
    COUNT(*) as entry_count,
    MIN(us.created_at) as first_created,
    MAX(us.created_at) as last_created
FROM user_stages us
JOIN profiles p ON us.user_id = p.id
WHERE us.stage = 'Interested'
GROUP BY us.user_id, p.email, p.full_name, us.stage
ORDER BY entry_count DESC, p.email;

-- Check the actual function output
SELECT 
    user_id,
    email,
    full_name,
    role,
    "position",
    stage_updated_at
FROM get_users_by_stage_with_rejected('Interested', FALSE)
ORDER BY email, stage_updated_at;
