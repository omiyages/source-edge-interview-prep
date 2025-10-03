-- Update the get_users_by_stage function to include rejected candidates option
CREATE OR REPLACE FUNCTION get_users_by_stage(p_stage VARCHAR(50), p_show_rejected BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMP WITH TIME ZONE,
  upcoming_interview_name TEXT,
  upcoming_interview_date TIMESTAMP WITH TIME ZONE,
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
    i.interview_name as upcoming_interview_name,
    i.scheduled_date as upcoming_interview_date,
    CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as is_rejected
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  LEFT JOIN LATERAL (
    SELECT interview_name, scheduled_date
    FROM interviews 
    WHERE user_id = p.id 
      AND status = 'scheduled' 
      AND scheduled_date >= NOW()
    ORDER BY scheduled_date ASC
    LIMIT 1
  ) i ON true
  WHERE us.stage = p_stage 
    AND us.is_active = true
    AND (
      p_show_rejected = true 
      OR ur.user_id IS NULL
    )
  ORDER BY us.updated_at DESC;
END;
$$ LANGUAGE plpgsql;
