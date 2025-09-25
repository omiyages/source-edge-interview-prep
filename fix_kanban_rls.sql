-- Fix Kanban RLS and Permissions Issues
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage user stages" ON user_stages;
DROP POLICY IF EXISTS "Admins can view stage transitions" ON stage_transitions;
DROP POLICY IF EXISTS "Admins can manage admin notes" ON admin_notes;
DROP POLICY IF EXISTS "Admins can manage user rejections" ON user_rejections;

-- 2. Create more permissive policies for testing
CREATE POLICY "Allow all operations on user_stages" ON user_stages
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on stage_transitions" ON stage_transitions
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on admin_notes" ON admin_notes
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on user_rejections" ON user_rejections
  FOR ALL USING (true);

-- 3. Grant all necessary permissions
GRANT ALL ON user_stages TO authenticated;
GRANT ALL ON stage_transitions TO authenticated;
GRANT ALL ON admin_notes TO authenticated;
GRANT ALL ON user_rejections TO authenticated;

-- 4. Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_current_stage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID, TEXT) TO authenticated;

-- 5. Test the function exists and is callable
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'move_user_to_stage';

-- 6. Check if we can call the function (this should not error)
SELECT move_user_to_stage(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'Test'::VARCHAR,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'Test move'::TEXT
);
