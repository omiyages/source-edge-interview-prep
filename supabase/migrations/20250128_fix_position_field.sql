-- Fix position field display in Kanban board
-- This migration ensures the position field is properly set up and returned

-- 1. Add position field to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position VARCHAR(255);

-- 2. Update some test users with positions (for testing)
UPDATE profiles 
SET position = 'Backend Engineer' 
WHERE email = 'vladislav@source-edge.com';

UPDATE profiles 
SET position = 'Frontend Engineer' 
WHERE email LIKE '%@source-edge.com' AND email != 'vladislav@source-edge.com'
LIMIT 2;

-- 3. Drop and recreate the function to include position field
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
    position VARCHAR,
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
        p.position,
        p.last_activity_at,
        COALESCE(us.total_session_time_minutes, 0) as total_session_time_minutes,
        us.updated_at as stage_updated_at,
        us.updated_at as last_updated_at,
        i.interview_type as upcoming_interview_name,
        i.scheduled_date as upcoming_interview_date,
        COALESCE(ur.is_rejected, FALSE) as is_rejected,
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
        SELECT interview_type, scheduled_date
        FROM interviews 
        WHERE user_id = p.id 
        AND scheduled_date > NOW()
        ORDER BY scheduled_date ASC
        LIMIT 1
    ) i ON TRUE
    WHERE us.stage_name = p_stage_name
    AND (p_show_rejected = TRUE OR ur.is_rejected IS NULL OR ur.is_rejected = FALSE)
    ORDER BY us.updated_at DESC;
END;
$$;
