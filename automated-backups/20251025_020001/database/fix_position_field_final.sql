-- Simple fix: Update the database function to include position field
-- Run this in your Supabase SQL Editor

-- 1. First, check if users have positions set
SELECT 'Current user positions:' as info;
SELECT id, email, full_name, role, "position" 
FROM profiles 
WHERE "position" IS NOT NULL 
LIMIT 10;

-- 2. Add position field if it doesn't exist (using quotes for reserved keyword)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "position" VARCHAR(255);

-- 3. Update the get_users_by_stage_with_rejected function to include position
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(VARCHAR, BOOLEAN);

CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(
    p_stage_name VARCHAR,
    p_show_rejected BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    "position" VARCHAR,
    last_activity_at TIMESTAMPTZ,
    total_session_time_minutes INTEGER,
    stage_updated_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ,
    upcoming_interview_name VARCHAR,
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
        p.email,
        p.full_name,
        p.role,
        p."position",
        p.updated_at as last_activity_at,
        COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
        us.updated_at as stage_updated_at,
        us.updated_at as last_updated_at,
        i.interview_name as upcoming_interview_name,
        i.scheduled_date as upcoming_interview_date,
        CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END as is_rejected,
        COALESCE(
            (SELECT COUNT(*)::INTEGER 
             FROM admin_notes an 
             WHERE an.user_id = p.id 
             AND an.note_type = 'todo' 
             AND an.is_completed = FALSE), 
            0
        ) as incomplete_tasks_count
    FROM profiles p
    LEFT JOIN user_stages us ON p.id = us.user_id
    LEFT JOIN user_rejections ur ON p.id = ur.user_id
    LEFT JOIN LATERAL (
        SELECT interview_name, scheduled_date
        FROM interviews 
        WHERE interviews.user_id = p.id 
        AND scheduled_date > NOW()
        ORDER BY scheduled_date ASC
        LIMIT 1
    ) i ON TRUE
    WHERE us.stage = p_stage_name
    AND (p_show_rejected = TRUE OR ur.id IS NULL)
    ORDER BY us.updated_at DESC;
END;
$$;

-- 4. Test the function
SELECT 'Testing function:' as info;
SELECT user_id, email, full_name, role, "position" 
FROM get_users_by_stage_with_rejected('Interested', FALSE) 
LIMIT 5;