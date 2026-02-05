-- Fix the get_users_by_stage function to handle type mismatch
CREATE OR REPLACE FUNCTION get_users_by_stage(p_stage VARCHAR(50))
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    COALESCE(p.position, p.role::text) as role, -- Cast role to text first
    p.last_activity_at,
    p.total_session_time_minutes,
    us.updated_at as stage_updated_at
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage 
    AND us.is_active = true
    AND ur.user_id IS NULL
  ORDER BY us.updated_at DESC;
END;
$$ LANGUAGE plpgsql;
