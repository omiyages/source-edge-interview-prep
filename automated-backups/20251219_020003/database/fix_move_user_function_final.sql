-- Final fix for move_user_to_stage function
-- This script will completely replace the function with the correct signature

-- 1. Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, VARCHAR, UUID, TEXT);
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, VARCHAR, UUID);
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, UUID, UUID);

-- 2. Ensure the user_stages table has the required columns
ALTER TABLE user_stages 
ADD COLUMN IF NOT EXISTS transitioned_by UUID REFERENCES auth.users(id);

ALTER TABLE user_stages 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create the correct function with the exact signature the frontend expects
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

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- 5. Test the function (this will show if it works)
-- You can uncomment this to test:
-- SELECT move_user_to_stage(
--   '00000000-0000-0000-0000-000000000000'::UUID,
--   'Interested',
--   '00000000-0000-0000-0000-000000000000'::UUID,
--   'Test'
-- );
