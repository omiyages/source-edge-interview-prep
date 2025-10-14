-- Create a SQL function to get all pending tasks with user information
-- This avoids the relationship ambiguity issue

CREATE OR REPLACE FUNCTION get_all_pending_tasks()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    note_content TEXT,
    note_type TEXT,
    is_completed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    priority TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.id,
        an.user_id,
        p.email as user_email,
        p.full_name as user_name,
        an.note_content,
        an.note_type,
        an.is_completed,
        an.created_at,
        an.updated_at,
        an.due_date,
        an.priority
    FROM admin_notes an
    INNER JOIN profiles p ON an.user_id = p.id
    WHERE an.note_type = 'todo'
    ORDER BY an.created_at DESC;
END;
$$;
