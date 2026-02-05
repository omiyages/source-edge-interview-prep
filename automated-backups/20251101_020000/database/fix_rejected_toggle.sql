-- Fix the rejected candidates toggle functionality
-- This creates a new function that handles the show_rejected parameter

CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(p_stage VARCHAR(50), p_show_rejected BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMP WITH TIME ZONE,
  is_rejected BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    COALESCE(p.position, p.role::text) as role,
    p.last_login_at as last_activity_at,
    p.total_session_time_minutes,
    us.updated_at as stage_updated_at,
    CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as is_rejected
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage 
    AND us.is_active = true
    AND (
      p_show_rejected = true 
      OR ur.user_id IS NULL
    )
  ORDER BY us.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO authenticated;
