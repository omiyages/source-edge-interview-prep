-- Fix function conflict by dropping all versions and creating a clean one

-- 1. Drop all versions of the function
DROP FUNCTION IF EXISTS get_users_by_stage(VARCHAR);
DROP FUNCTION IF EXISTS get_users_by_stage(VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS get_users_by_stage(character varying);
DROP FUNCTION IF EXISTS get_users_by_stage(character varying, boolean);

-- 2. Create a clean, simple version
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
    COALESCE(p.position, p.role::text) as role,
    p.last_login_at as last_activity_at,
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage(VARCHAR) TO authenticated;

-- 4. Test the function
SELECT * FROM get_users_by_stage('Interested') LIMIT 3;
