-- Fix Kanban board counters with correct data type casting
-- Run this in your Supabase SQL Editor

-- Update the function to fix data type mismatches
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
        i.interview_name::TEXT as upcoming_interview_name,
        i.scheduled_date as upcoming_interview_date,
        CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END as is_rejected,
        COALESCE(task_count.incomplete_tasks, 0) as incomplete_tasks_count
    FROM profiles p
    INNER JOIN user_stages us ON p.id = us.user_id
    LEFT JOIN user_rejections ur ON p.id = ur.user_id
    LEFT JOIN LATERAL (
        SELECT interview_name, scheduled_date
        FROM interviews 
        WHERE interviews.user_id = p.id 
        AND scheduled_date > NOW() 
        ORDER BY scheduled_date ASC 
        LIMIT 1
    ) i ON TRUE
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::INTEGER as incomplete_tasks
        FROM admin_notes 
        WHERE admin_notes.user_id = p.id 
        AND note_type = 'todo' 
        AND is_completed = FALSE
    ) task_count ON TRUE
    WHERE us.stage = p_stage_name
    AND (p_show_rejected = TRUE OR ur.id IS NULL)
    ORDER BY us.updated_at DESC;
END;
$$;

-- Test the function
SELECT 'Testing final corrected function:' as info;
SELECT user_id, email, full_name, incomplete_tasks_count, upcoming_interview_name
FROM get_users_by_stage_with_rejected('Interested', FALSE)
ORDER BY email;
