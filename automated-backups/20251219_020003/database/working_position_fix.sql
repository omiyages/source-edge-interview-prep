-- Working fix: Add position field with correct data types
-- Run this in your Supabase SQL Editor

-- 1. Add position field if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "position" VARCHAR(255);

-- 2. Update the function to include position field with correct types
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
    LEFT JOIN user_stages us ON p.id = us.user_id
    LEFT JOIN user_rejections ur ON p.id = ur.user_id
    WHERE us.stage = p_stage_name
    AND (p_show_rejected = TRUE OR ur.id IS NULL)
    ORDER BY us.updated_at DESC;
END;
$$;

-- 3. Test the function
SELECT 'Testing function:' as info;
SELECT user_id, email, full_name, role, "position" 
FROM get_users_by_stage_with_rejected('Interested', FALSE) 
LIMIT 5;
