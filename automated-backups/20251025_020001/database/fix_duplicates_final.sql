-- Final fix for duplicates - more aggressive cleanup
-- Run this in your Supabase SQL Editor

-- 1. Show current duplicates
SELECT 'Current duplicates in user_stages:' as info;
SELECT us.user_id, p.email, p.full_name, us.stage, COUNT(*) as count
FROM user_stages us
JOIN profiles p ON us.user_id = p.id
WHERE us.stage = 'Interested'
GROUP BY us.user_id, p.email, p.full_name, us.stage
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Delete ALL user_stages entries for Interested stage
DELETE FROM user_stages WHERE stage = 'Interested';

-- 3. Recreate user_stages entries properly (one per user)
INSERT INTO user_stages (user_id, stage, created_at, updated_at)
SELECT DISTINCT 
    p.id as user_id,
    'Interested' as stage,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE p.id IN (
    SELECT DISTINCT user_id 
    FROM user_stages 
    WHERE stage = 'Interested'
);

-- 4. Update the function to be more robust
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(VARCHAR, BOOLEAN);

CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(
    p_stage_name VARCHAR,
    p_show_rejected BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    "position" TEXT,
    last_activity_at TIMESTAMPTZ,
    total_session_time_minutes INTEGER,
    stage_updated_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ,
    upcoming_interview_name TEXT,
    upcoming_interview_date TIMESTAMPTZ,
    is_rejected BOOLEAN,
    incomplete_tasks_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email::TEXT,
        p.full_name::TEXT,
        p.role::TEXT,
        p."position"::TEXT,
        p.updated_at as last_activity_at,
        COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
        us.updated_at as stage_updated_at,
        us.updated_at as last_updated_at,
        NULL::TEXT as upcoming_interview_name,
        NULL::TIMESTAMPTZ as upcoming_interview_date,
        CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END as is_rejected,
        0::INTEGER as incomplete_tasks_count
    FROM profiles p
    INNER JOIN user_stages us ON p.id = us.user_id
    LEFT JOIN user_rejections ur ON p.id = ur.user_id
    WHERE us.stage = p_stage_name
    AND (p_show_rejected = TRUE OR ur.id IS NULL)
    ORDER BY us.updated_at DESC;
END;
$$;

-- 5. Test the function
SELECT 'Testing function after cleanup:' as info;
SELECT user_id, email, full_name, role, "position", stage_updated_at
FROM get_users_by_stage_with_rejected('Interested', FALSE)
ORDER BY email;
