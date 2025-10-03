-- Fix Duplicate Users Issue
-- Run this SQL in your Supabase SQL Editor

-- 1. Add is_current column to user_stages table
ALTER TABLE user_stages ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- 2. Update existing records to mark only the latest stage as current
-- First, let's see what data we have
SELECT 'Current user_stages data:' as status;
SELECT 
  us.id,
  us.user_id,
  us.stage,
  us.is_current,
  us.created_at,
  p.email
FROM user_stages us
LEFT JOIN profiles p ON us.user_id = p.id
ORDER BY us.user_id, us.created_at DESC;

-- 3. Update all existing records to not current first
UPDATE user_stages SET is_current = false;

-- 4. For each user, mark only their latest stage as current
WITH latest_stages AS (
  SELECT 
    user_id,
    stage,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_stages
)
UPDATE user_stages 
SET is_current = true
FROM latest_stages ls
WHERE user_stages.user_id = ls.user_id 
  AND user_stages.stage = ls.stage 
  AND user_stages.created_at = ls.created_at
  AND ls.rn = 1;

-- 5. Update the function to only show current stages
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
  AND us.is_current = true  -- Only show current stages
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- 6. Update move_user_to_stage function to handle current stages properly
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
DECLARE
  current_stage_name VARCHAR(100);
BEGIN
  -- Get current stage name
  SELECT stage INTO current_stage_name
  FROM user_stages 
  WHERE user_id = p_user_id 
  AND is_current = true;
  
  -- Update current stage to not current
  UPDATE user_stages 
  SET is_current = false
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Insert new stage record
  INSERT INTO user_stages (user_id, stage, is_current, transitioned_by, notes)
  VALUES (p_user_id, p_new_stage_name, true, p_transitioned_by, p_notes);
  
  -- Log the transition
  INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes)
  VALUES (p_user_id, current_stage_name, p_new_stage_name, p_transitioned_by, p_notes);
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- 8. Test the function
SELECT 'Testing function with current stages only:' as status;

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

-- 9. Show current stage assignments
SELECT 'Current stage assignments:' as status;
SELECT 
  us.user_id,
  us.stage,
  us.is_current,
  p.email,
  p.full_name
FROM user_stages us
LEFT JOIN profiles p ON us.user_id = p.id
WHERE us.is_current = true
ORDER BY us.stage, p.email;

SELECT 'Duplicate users fix completed!' as status;
