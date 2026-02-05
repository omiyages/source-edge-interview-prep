-- Comprehensive fix for all Kanban-related functions
-- This ensures all functions exist with correct signatures

-- 1. Fix missing session function
CREATE OR REPLACE FUNCTION update_user_session_time(
  additional_minutes INTEGER,
  user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's total session time
  UPDATE profiles 
  SET 
    total_session_time_minutes = COALESCE(total_session_time_minutes, 0) + additional_minutes,
    last_login_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 2. Ensure user_stages table has required columns
ALTER TABLE user_stages 
ADD COLUMN IF NOT EXISTS transitioned_by UUID REFERENCES auth.users(id);

ALTER TABLE user_stages 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE user_stages 
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- 3. Ensure stage_transitions table has required columns
ALTER TABLE stage_transitions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Drop all existing move_user_to_stage functions to avoid conflicts
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, VARCHAR, UUID, TEXT);
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, VARCHAR, UUID);
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, UUID, UUID);

-- 5. Create the correct move_user_to_stage function
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

-- 6. Create get_users_by_stage_with_rejected function
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS get_users_by_stage_with_rejected(UUID, BOOLEAN);

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
  is_rejected BOOLEAN,
  incomplete_tasks_count INTEGER
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
    COALESCE(us.last_updated_at, us.created_at) as last_updated_at,
    (SELECT name FROM interviews WHERE user_id = p.id AND scheduled_date > NOW() ORDER BY scheduled_date ASC LIMIT 1) as upcoming_interview_name,
    (SELECT scheduled_date FROM interviews WHERE user_id = p.id AND scheduled_date > NOW() ORDER BY scheduled_date ASC LIMIT 1) as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected,
    (SELECT COUNT(*) FROM admin_notes an WHERE an.user_id = p.id AND an.note_type = 'todo' AND an.is_completed = false) as incomplete_tasks_count
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage_name
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.last_updated_at, us.created_at) DESC;
END;
$$;

-- 7. Grant all permissions
GRANT EXECUTE ON FUNCTION update_user_session_time(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(VARCHAR, BOOLEAN) TO authenticated;

-- 8. Create RLS policies if they don't exist
-- User stages policies
DROP POLICY IF EXISTS "Users can view their own stages" ON user_stages;
DROP POLICY IF EXISTS "Admins can manage user stages" ON user_stages;

CREATE POLICY "Users can view their own stages" ON user_stages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user stages" ON user_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Stage transitions policies
DROP POLICY IF EXISTS "Users can view their own stage transitions" ON stage_transitions;
DROP POLICY IF EXISTS "Admins can manage stage transitions" ON stage_transitions;

CREATE POLICY "Users can view their own stage transitions" ON stage_transitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage stage transitions" ON stage_transitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
