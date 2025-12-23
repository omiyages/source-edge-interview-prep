-- Create function to unreject a user
-- This allows admins to undo accidental rejections

CREATE OR REPLACE FUNCTION unreject_user(
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_previous_stage VARCHAR(50);
BEGIN
  -- Get the user's previous stage before rejection
  -- We'll look for the most recent inactive stage
  SELECT stage INTO v_previous_stage
  FROM user_stages
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If no previous stage found, default to 'Interested'
  IF v_previous_stage IS NULL THEN
    v_previous_stage := 'Interested';
  END IF;
  
  -- Delete the rejection record
  DELETE FROM user_rejections
  WHERE user_id = p_user_id;
  
  -- Reactivate the user's stage (or create one if it doesn't exist)
  -- First, deactivate any currently active stages
  UPDATE user_stages
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Check if a stage entry exists for this user and stage
  IF EXISTS (
    SELECT 1 FROM user_stages
    WHERE user_id = p_user_id AND stage = v_previous_stage
  ) THEN
    -- Reactivate the existing stage entry
    UPDATE user_stages
    SET is_active = true, updated_at = NOW()
    WHERE user_id = p_user_id AND stage = v_previous_stage;
  ELSE
    -- Create a new stage entry
    INSERT INTO user_stages (user_id, stage, is_active, updated_at)
    VALUES (p_user_id, v_previous_stage, true, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION unreject_user(UUID) TO authenticated;

