-- Update the get_users_by_stage_with_rejected function to include incomplete tasks count
-- This will help color-code Kanban cards based on user status

-- Drop the existing function
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(VARCHAR, BOOLEAN);

-- Create the updated function with incomplete tasks count
CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(
  p_stage_name VARCHAR(100),
  p_show_rejected BOOLEAN DEFAULT false
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  upcoming_interview_name TEXT,
  upcoming_interview_date TIMESTAMP WITH TIME ZONE,
  is_rejected BOOLEAN,
  incomplete_tasks_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    NULL::TEXT as upcoming_interview_name,
    NULL::TIMESTAMP WITH TIME ZONE as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM admin_notes an 
       WHERE an.user_id = p.id 
       AND an.note_type = 'todo' 
       AND (an.is_completed = false OR an.is_completed IS NULL)
      ), 0
    ) as incomplete_tasks_count
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage_name
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.last_updated_at, us.created_at) DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO anon;

-- Test the function
SELECT 
  s.name as stage_name,
  COUNT(g.user_id) as user_count,
  COUNT(CASE WHEN g.incomplete_tasks_count > 0 THEN 1 END) as users_with_incomplete_tasks,
  COUNT(CASE WHEN g.upcoming_interview_name IS NOT NULL THEN 1 END) as users_with_interviews
FROM stages s
LEFT JOIN get_users_by_stage_with_rejected(s.name, false) g ON true
GROUP BY s.name, s.order_index
ORDER BY s.order_index;
