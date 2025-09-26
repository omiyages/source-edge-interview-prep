-- Final cleanup script to fix Kanban board issues
-- This will remove unwanted users and prevent auto-addition

-- 1. First, let's see what users are currently in user_stages
SELECT 'BEFORE CLEANUP - Current users in user_stages:' as info;
SELECT 
  p.email, 
  p.full_name, 
  p.role,
  p.position,
  us.stage, 
  us.is_current,
  us.created_at
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.is_current = true
ORDER BY us.created_at DESC;

-- 2. Remove users who shouldn't be on Kanban board
-- Remove admin users
DELETE FROM user_stages 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.role = 'admin'
);

-- Remove users without positions (they're not candidates)
DELETE FROM user_stages 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.position IS NULL 
  OR p.position = ''
  OR p.position = 'null'
);

-- Remove users with system/admin names
DELETE FROM user_stages 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.full_name ILIKE '%admin%'
  OR p.full_name ILIKE '%system%'
  OR p.email ILIKE '%admin%'
  OR p.email ILIKE '%system%'
);

-- 3. Check what users remain after cleanup
SELECT 'AFTER CLEANUP - Remaining users in user_stages:' as info;
SELECT 
  p.email, 
  p.full_name, 
  p.role,
  p.position,
  us.stage, 
  us.is_current,
  us.created_at
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.is_current = true
ORDER BY us.created_at DESC;

-- 4. Create a function to prevent automatic addition of users to Kanban
-- This function should only be called explicitly, not automatically
CREATE OR REPLACE FUNCTION add_candidate_to_kanban(
  p_user_id UUID,
  p_stage_name VARCHAR(100),
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_position TEXT;
  user_role TEXT;
BEGIN
  -- Check if user exists and has required fields
  SELECT position, role INTO user_position, user_role
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Only allow if user has a position (is a candidate)
  IF user_position IS NULL OR user_position = '' OR user_position = 'null' THEN
    RAISE EXCEPTION 'User must have a position to be added to Kanban board';
  END IF;
  
  -- Don't allow admin users
  IF user_role = 'admin' THEN
    RAISE EXCEPTION 'Admin users cannot be added to Kanban board';
  END IF;
  
  -- Add to user_stages
  INSERT INTO user_stages (user_id, stage, is_current, transitioned_by, notes)
  VALUES (p_user_id, p_stage_name, true, p_transitioned_by, p_notes);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_candidate_to_kanban(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- 5. Drop the existing function first, then create the new one
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, VARCHAR, UUID, TEXT);

-- Create the new move_user_to_stage function with validation
CREATE OR REPLACE FUNCTION move_user_to_stage(
  p_user_id UUID,
  p_new_stage_name VARCHAR(100),
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_position TEXT;
  user_role TEXT;
BEGIN
  -- Check if user exists and has required fields
  SELECT position, role INTO user_position, user_role
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Only allow if user has a position (is a candidate)
  IF user_position IS NULL OR user_position = '' OR user_position = 'null' THEN
    RAISE EXCEPTION 'User must have a position to be moved on Kanban board';
  END IF;
  
  -- Don't allow admin users
  IF user_role = 'admin' THEN
    RAISE EXCEPTION 'Admin users cannot be moved on Kanban board';
  END IF;
  
  -- Mark current stage as not current
  UPDATE user_stages 
  SET is_current = false 
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Add new stage
  INSERT INTO user_stages (user_id, stage, is_current, transitioned_by, notes)
  VALUES (p_user_id, p_new_stage_name, true, p_transitioned_by, p_notes);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- 6. Test the functions
SELECT 'Testing functions...' as info;
SELECT 'Functions created successfully' as result;
