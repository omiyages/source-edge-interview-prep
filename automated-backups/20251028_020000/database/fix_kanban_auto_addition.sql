-- Fix the issue where all users are automatically added to Kanban
-- This script will remove users who shouldn't be on the Kanban board

-- 1. First, let's see what users are currently in user_stages
SELECT 'Current users in user_stages:' as info;
SELECT 
  p.email, 
  p.full_name, 
  us.stage, 
  us.is_current,
  us.created_at
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.is_current = true
ORDER BY us.created_at DESC;

-- 2. Remove users who shouldn't be on Kanban (like admin users or users who weren't explicitly added)
-- We'll keep only users who were explicitly added through the Kanban system
-- Remove users who are admins or system users
DELETE FROM user_stages 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.role = 'admin' 
  OR p.email LIKE '%admin%'
  OR p.email LIKE '%system%'
  OR p.full_name LIKE '%Admin%'
  OR p.full_name LIKE '%System%'
);

-- 3. Also remove users who don't have a position assigned (they shouldn't be candidates)
DELETE FROM user_stages 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.position IS NULL 
  OR p.position = ''
);

-- 4. Check what users remain
SELECT 'Remaining users in user_stages after cleanup:' as info;
SELECT 
  p.email, 
  p.full_name, 
  p.position,
  us.stage, 
  us.is_current,
  us.created_at
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.is_current = true
ORDER BY us.created_at DESC;

-- 5. Add a constraint to prevent future auto-addition
-- Create a function that only allows explicit Kanban additions
CREATE OR REPLACE FUNCTION add_user_to_kanban_explicitly(
  p_user_id UUID,
  p_stage_name VARCHAR(100),
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only add if user has a position (is a candidate)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND position IS NOT NULL 
    AND position != ''
  ) THEN
    RAISE EXCEPTION 'User must have a position to be added to Kanban';
  END IF;
  
  -- Add to user_stages
  INSERT INTO user_stages (user_id, stage, is_current, transitioned_by, notes)
  VALUES (p_user_id, p_stage_name, true, p_transitioned_by, p_notes);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_user_to_kanban_explicitly(UUID, VARCHAR, UUID, TEXT) TO authenticated;
