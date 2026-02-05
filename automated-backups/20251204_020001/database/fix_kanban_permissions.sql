-- Fix Kanban Permissions and Function Issues
-- Run this in Supabase SQL Editor

-- 1. Check if the function exists and recreate if needed
CREATE OR REPLACE FUNCTION move_user_to_stage(
  p_user_id UUID,
  p_new_stage VARCHAR(50),
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_stage VARCHAR(50);
BEGIN
  -- Get current stage
  SELECT stage INTO current_stage 
  FROM user_stages 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Deactivate current stage
  UPDATE user_stages 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Insert new stage
  INSERT INTO user_stages (user_id, stage, is_active)
  VALUES (p_user_id, p_new_stage, true)
  ON CONFLICT (user_id, stage) 
  DO UPDATE SET is_active = true, updated_at = NOW();
  
  -- Record transition
  INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes)
  VALUES (p_user_id, current_stage, p_new_stage, p_transitioned_by, p_notes);
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure RLS policies are correct
DROP POLICY IF EXISTS "Admins can manage user stages" ON user_stages;
CREATE POLICY "Admins can manage user stages" ON user_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view stage transitions" ON stage_transitions;
CREATE POLICY "Admins can view stage transitions" ON stage_transitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_current_stage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID, TEXT) TO authenticated;

-- 4. Grant table permissions
GRANT ALL ON user_stages TO authenticated;
GRANT ALL ON stage_transitions TO authenticated;
GRANT ALL ON admin_notes TO authenticated;
GRANT ALL ON user_rejections TO authenticated;

-- 5. Test the function (uncomment and replace with actual IDs)
-- SELECT move_user_to_stage(
--   'your-user-id'::UUID,
--   'Scheduled'::VARCHAR,
--   'your-admin-id'::UUID,
--   'Test move'::TEXT
-- );
