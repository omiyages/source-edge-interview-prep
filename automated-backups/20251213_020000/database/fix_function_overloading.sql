-- Fix Function Overloading Issue
-- Run this SQL in your Supabase SQL Editor

-- STEP 1: Drop ALL existing versions of the function to avoid conflicts
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Find and drop all versions of get_users_by_stage_with_rejected
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as arg_types
        FROM pg_proc 
        WHERE proname LIKE '%get_users_by_stage%'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.arg_types || ') CASCADE';
            RAISE NOTICE 'Dropped function: % (%)', func_record.proname, func_record.arg_types;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function: % (%) - %', func_record.proname, func_record.arg_types, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 2: Drop all versions of move_user_to_stage as well
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as arg_types
        FROM pg_proc 
        WHERE proname LIKE '%move_user_to_stage%'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.arg_types || ') CASCADE';
            RAISE NOTICE 'Dropped function: % (%)', func_record.proname, func_record.arg_types;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function: % (%) - %', func_record.proname, func_record.arg_types, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 3: Drop all versions of reject_user as well
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as arg_types
        FROM pg_proc 
        WHERE proname LIKE '%reject_user%'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.arg_types || ') CASCADE';
            RAISE NOTICE 'Dropped function: % (%)', func_record.proname, func_record.arg_types;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function: % (%) - %', func_record.proname, func_record.arg_types, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 4: Create a single, clean version of get_users_by_stage_with_rejected
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

-- STEP 5: Create a single, clean version of move_user_to_stage
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
  SELECT stage_id INTO current_stage_id
  FROM user_stages 
  WHERE user_id = p_user_id 
  AND is_current = true;
  
  -- Update current stage to not current
  UPDATE user_stages 
  SET is_current = false
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Insert new stage record
  INSERT INTO user_stages (user_id, stage_id, is_current, transitioned_by, notes)
  VALUES (p_user_id, p_new_stage, true, p_transitioned_by, p_notes);
  
  -- Log the transition
  INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes)
  VALUES (p_user_id, current_stage_id, p_new_stage, p_transitioned_by, p_notes);
END;
$$;

-- STEP 6: Create a single, clean version of reject_user
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_rejected_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert rejection record
  INSERT INTO user_rejections (user_id, rejected_by, reason)
  VALUES (p_user_id, p_rejected_by, p_reason);
END;
$$;

-- STEP 7: Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID, TEXT) TO authenticated;

-- STEP 8: Verify only one version of each function exists
SELECT 'Function cleanup completed. Current functions:' as status;

SELECT 
  proname as function_name,
  oidvectortypes(proargtypes) as parameters
FROM pg_proc 
WHERE proname LIKE '%get_users_by_stage%' 
   OR proname LIKE '%move_user_to_stage%'
   OR proname LIKE '%reject_user%'
ORDER BY proname;

SELECT 'Function overloading issue resolved!' as status;
