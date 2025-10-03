-- Fix Missing Columns Issue
-- Run this SQL in your Supabase SQL Editor

-- 1. Check what columns actually exist in user_stages table
SELECT 'Checking user_stages table structure:' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_stages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what data exists in user_stages
SELECT 'Checking user_stages data:' as status;
SELECT * FROM user_stages LIMIT 5;

-- 3. Check what data exists in stages
SELECT 'Checking stages data:' as status;
SELECT id, name, order_index FROM stages ORDER BY order_index;

-- 4. Drop the existing function
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID, BOOLEAN);

-- 5. Create a simple function that works with the actual table structure
-- We'll assume the table has basic columns: id, user_id, stage, created_at
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
DECLARE
  stage_name VARCHAR(100);
BEGIN
  -- Get the stage name from the stage ID
  SELECT name INTO stage_name FROM stages WHERE id = p_stage;
  
  -- If stage not found, return empty result
  IF stage_name IS NULL THEN
    RETURN;
  END IF;
  
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
  WHERE us.stage = stage_name  -- Compare with stage name (VARCHAR)
  -- Removed is_current check since column doesn't exist
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- 6. Create a simple move_user_to_stage function
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
  new_stage_name VARCHAR(100);
BEGIN
  -- Get new stage name
  SELECT name INTO new_stage_name FROM stages WHERE id = p_new_stage;
  
  -- If new stage not found, return
  IF new_stage_name IS NULL THEN
    RETURN;
  END IF;
  
  -- Insert new stage record (assuming we just add new records, not update existing)
  INSERT INTO user_stages (user_id, stage, transitioned_by, notes)
  VALUES (p_user_id, new_stage_name, p_transitioned_by, p_notes);
  
  -- Log the transition
  INSERT INTO stage_transitions (user_id, to_stage, transitioned_by, notes)
  VALUES (p_user_id, new_stage_name, p_transitioned_by, p_notes);
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, UUID, UUID, TEXT) TO authenticated;

-- 8. Test the function
SELECT 'Testing function with actual table structure:' as status;

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

-- 9. Show the actual table structure for debugging
SELECT 'Final table structure check:' as status;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_stages', 'stages', 'user_rejections')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT 'Missing columns fix completed!' as status;
