-- Complete Kanban Restore - Nuclear Option
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop ALL functions that might conflict
DO $$ 
BEGIN
  -- Drop all possible versions
  DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID, BOOLEAN);
  DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID);
  DROP FUNCTION IF EXISTS get_users_by_stage(UUID, BOOLEAN);
  DROP FUNCTION IF EXISTS get_users_by_stage(UUID);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore all errors
    NULL;
END $$;

-- 2. Create the original working function (from before all the changes)
CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(
  p_stage UUID,
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
  upcoming_interview_name TEXT,
  upcoming_interview_date TIMESTAMP WITH TIME ZONE,
  is_rejected BOOLEAN
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
    COALESCE(us.total_session_time_minutes, 0) as total_session_time_minutes,
    us.created_at as stage_updated_at,
    NULL::TEXT as upcoming_interview_name,
    NULL::TIMESTAMP WITH TIME ZONE as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage_id = p_stage 
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY us.created_at DESC;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;

-- 4. Test the function with a simple query
SELECT 'Testing function...' as status;

-- Test if we can call the function
SELECT COUNT(*) as user_count 
FROM get_users_by_stage_with_rejected(
  (SELECT id FROM stages LIMIT 1), 
  false
);

-- 5. Check if we have any users in user_stages
SELECT 'Checking user_stages data...' as status;
SELECT COUNT(*) as total_user_stages FROM user_stages;
SELECT COUNT(*) as current_user_stages FROM user_stages WHERE is_current = true;

-- 6. Check stages
SELECT 'Checking stages...' as status;
SELECT id, name FROM stages ORDER BY name;
