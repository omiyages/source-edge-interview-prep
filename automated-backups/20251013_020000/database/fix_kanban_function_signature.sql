-- Fix Kanban Function Signature
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID, BOOLEAN);

-- 2. Create the function with the correct signature that matches the RPC call
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
  WHERE us.stage_id = p_stage 
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;

-- 4. Test the function
SELECT 'Testing function signature fix:' as status;

-- Test with a stage that exists
DO $$
DECLARE
    stage_id UUID;
    result_count INTEGER;
BEGIN
    -- Get first stage
    SELECT id INTO stage_id FROM stages ORDER BY order_index LIMIT 1;
    
    IF stage_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with stage ID: %', stage_id;
        
        -- Test the function
        SELECT COUNT(*) INTO result_count 
        FROM get_users_by_stage_with_rejected(stage_id, false);
        
        RAISE NOTICE 'Function returned % users', result_count;
    ELSE
        RAISE NOTICE 'No stages found!';
    END IF;
END $$;

-- 5. Show function signature
SELECT 'Function signature:' as status;
SELECT 
  proname as function_name,
  oidvectortypes(proargtypes) as parameters,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_users_by_stage_with_rejected';

SELECT 'Function signature fix completed.' as status;
