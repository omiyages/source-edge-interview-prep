-- Fix Kanban Stage Names Issue
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID, BOOLEAN);

-- 2. Create a function that accepts stage names instead of UUIDs
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
    COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
    us.created_at as stage_updated_at,
    COALESCE(us.updated_at, us.created_at) as last_updated_at,
    NULL::TEXT as upcoming_interview_name,
    NULL::TIMESTAMP WITH TIME ZONE as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage_name  -- Compare with stage name directly
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- 3. Update move_user_to_stage function to work with stage names
CREATE OR REPLACE FUNCTION move_user_to_stage(
  p_user_id UUID,
  p_new_stage_name VARCHAR(100),
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new stage record
  INSERT INTO user_stages (user_id, stage, transitioned_by, notes)
  VALUES (p_user_id, p_new_stage_name, p_transitioned_by, p_notes);
  
  -- Log the transition
  INSERT INTO stage_transitions (user_id, to_stage, transitioned_by, notes)
  VALUES (p_user_id, p_new_stage_name, p_transitioned_by, p_notes);
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- 5. Test the function with stage names
SELECT 'Testing function with stage names:' as status;

-- Test with a stage name that exists
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Test the function with a stage name
    SELECT COUNT(*) INTO result_count 
    FROM get_users_by_stage_with_rejected('Interested', false);
    
    RAISE NOTICE 'Function returned % users for stage "Interested"', result_count;
END $$;

-- 6. Test with all stage names
SELECT 'Testing all stage names:' as status;
SELECT 
  s.name as stage_name,
  COUNT(g.user_id) as user_count
FROM stages s
LEFT JOIN get_users_by_stage_with_rejected(s.name, false) g ON true
GROUP BY s.name, s.order_index
ORDER BY s.order_index;

SELECT 'Stage names fix completed!' as status;
