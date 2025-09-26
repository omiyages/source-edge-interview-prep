-- Fix the get_users_by_stage_with_rejected function to handle missing interviews table columns

-- First, let's check what columns exist in the interviews table
SELECT 'Current interviews table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'interviews';

-- Drop and recreate the function without the problematic interview columns
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(VARCHAR, BOOLEAN);

CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(
  p_stage_name VARCHAR(100),
  p_show_rejected BOOLEAN DEFAULT false
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_activity_at TIMESTAMPTZ,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  upcoming_interview_name TEXT,
  upcoming_interview_date TIMESTAMPTZ,
  is_rejected BOOLEAN,
  incomplete_tasks_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    COALESCE(p.full_name, '') as full_name,
    COALESCE(p.role::text, 'user') as role,
    p.last_login_at as last_activity_at,
    COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
    us.created_at as stage_updated_at,
    COALESCE(us.last_updated_at, us.created_at) as last_updated_at,
    NULL::TEXT as upcoming_interview_name,  -- Set to NULL for now
    NULL::TIMESTAMPTZ as upcoming_interview_date,  -- Set to NULL for now
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected,
    (SELECT COUNT(*) FROM admin_notes an WHERE an.user_id = p.id AND an.note_type = 'todo' AND an.is_completed = false) as incomplete_tasks_count
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage_name
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.last_updated_at, us.created_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO authenticated;

-- Test the function
SELECT 'Testing fixed function:' as info;
SELECT * FROM get_users_by_stage_with_rejected('Interested', false) LIMIT 5;
