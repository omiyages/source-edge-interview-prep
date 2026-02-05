-- Comprehensive fix for duplicate users
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what's causing duplicates
SELECT 'Diagnosing duplicates:' as info;

-- Check for multiple user_stages entries
SELECT us.user_id, p.email, p.full_name, us.stage, us.created_at, us.updated_at
FROM user_stages us
JOIN profiles p ON us.user_id = p.id
WHERE us.stage = 'Interested'
ORDER BY us.user_id, us.created_at;

-- 2. Clean up duplicate user_stages entries (keep only the latest)
WITH duplicate_stages AS (
    SELECT user_id, stage, 
           ROW_NUMBER() OVER (PARTITION BY user_id, stage ORDER BY updated_at DESC) as rn
    FROM user_stages
    WHERE stage = 'Interested'
)
DELETE FROM user_stages 
WHERE (user_id, stage) IN (
    SELECT user_id, stage 
    FROM duplicate_stages 
    WHERE rn > 1
);

-- 3. Update the function to handle any remaining edge cases
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
        MAX(us.updated_at) as stage_updated_at,
        MAX(us.updated_at) as last_updated_at,
        NULL::TEXT as upcoming_interview_name,
        NULL::TIMESTAMPTZ as upcoming_interview_date,
        CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END as is_rejected,
        0::INTEGER as incomplete_tasks_count
    FROM profiles p
    INNER JOIN user_stages us ON p.id = us.user_id
    LEFT JOIN user_rejections ur ON p.id = ur.user_id
    WHERE us.stage = p_stage_name
    AND (p_show_rejected = TRUE OR ur.id IS NULL)
    GROUP BY p.id, p.email, p.full_name, p.role, p."position", p.updated_at, p.total_session_time_minutes, ur.id
    ORDER BY MAX(us.updated_at) DESC;
END;
$$;

-- 4. Test the function
SELECT 'Testing fixed function:' as info;
SELECT user_id, email, full_name, role, "position", stage_updated_at
FROM get_users_by_stage_with_rejected('Interested', FALSE) 
ORDER BY email;
