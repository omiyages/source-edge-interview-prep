-- Fix the function to use VARCHAR consistently instead of TEXT
-- This resolves the type mismatch error

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
    company VARCHAR,
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
        p.email::VARCHAR,
        p.full_name::VARCHAR,
        p.role::VARCHAR,
        p."position"::VARCHAR,
        COALESCE(p.company, 'Woven by Toyota')::VARCHAR as company,
        p.updated_at as last_activity_at,
        COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
        us.updated_at as stage_updated_at,
        us.updated_at as last_updated_at,
        i.interview_name::VARCHAR as upcoming_interview_name,
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
SELECT 'Function test - Interested stage:' as test;
SELECT user_id, email, full_name, "position", company 
FROM get_users_by_stage_with_rejected('Interested', true) 
LIMIT 5;

-- Check all stages
SELECT 'All stages check:' as test;
SELECT stage, COUNT(*) as user_count
FROM user_stages 
WHERE is_active = true
GROUP BY stage
ORDER BY user_count DESC;
