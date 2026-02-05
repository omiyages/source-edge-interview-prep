-- Fix Column Names in Kanban Function
-- Run this SQL in your Supabase SQL Editor

-- 1. First, let's check the actual column names in user_stages table
SELECT 'Checking user_stages table structure:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_stages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check stages table structure
SELECT 'Checking stages table structure:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'stages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Drop the existing function
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID, BOOLEAN);

-- 4. Create the function with correct column names
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
  WHERE us.stage = p_stage  -- Changed from us.stage_id to us.stage
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- 5. Update move_user_to_stage function with correct column names
CREATE OR REPLACE FUNCTION move_user_to_stage(
  p_user_id UUID,
  p_new_stage UUID,
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stage_id UUID;
BEGIN
  -- Get current stage
  SELECT stage INTO current_stage_id  -- Changed from stage_id to stage
  FROM user_stages 
  WHERE user_id = p_user_id 
  AND is_current = true;
  
  -- Update current stage to not current
  UPDATE user_stages 
  SET is_current = false
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Insert new stage record
  INSERT INTO user_stages (user_id, stage, is_current, transitioned_by, notes)  -- Changed stage_id to stage
  VALUES (p_user_id, p_new_stage, true, p_transitioned_by, p_notes);
  
  -- Log the transition
  INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes)
  VALUES (p_user_id, current_stage_id, p_new_stage, p_transitioned_by, p_notes);
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, UUID, UUID, TEXT) TO authenticated;

-- 7. Test the function
SELECT 'Testing function with correct column names:' as status;

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

SELECT 'Column names fix completed!' as status;
