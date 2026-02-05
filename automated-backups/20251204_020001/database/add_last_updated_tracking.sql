-- Add last_updated_at tracking to user_stages and related tables
-- Run this SQL in your Supabase SQL Editor

-- 1. Add last_updated_at column to user_stages table
ALTER TABLE user_stages ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add last_updated_at column to admin_notes table
ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add last_updated_at column to interviews table (if not exists)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Update the move_user_to_stage function to update last_updated_at
CREATE OR REPLACE FUNCTION move_user_to_stage(
  p_user_id UUID,
  p_new_stage UUID,
  p_transitioned_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stage_id UUID;
  stage_name TEXT;
BEGIN
  -- Get current stage
  SELECT stage_id INTO current_stage_id
  FROM user_stages 
  WHERE user_id = p_user_id 
  AND is_current = true;
  
  -- Get stage name
  SELECT name INTO stage_name
  FROM stages 
  WHERE id = p_new_stage;
  
  -- Update current stage to not current
  UPDATE user_stages 
  SET is_current = false, last_updated_at = NOW()
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Insert new stage record
  INSERT INTO user_stages (user_id, stage_id, is_current, transitioned_by, notes, last_updated_at)
  VALUES (p_user_id, p_new_stage, true, p_transitioned_by, p_notes, NOW());
  
  -- Log the transition
  INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes, created_at)
  VALUES (p_user_id, current_stage_id, p_new_stage, p_transitioned_by, p_notes, NOW());
  
  RETURN true;
END;
$$;

-- 5. Create function to update last_updated_at when notes are added/updated
CREATE OR REPLACE FUNCTION update_user_last_activity(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user_stages last_updated_at
  UPDATE user_stages 
  SET last_updated_at = NOW()
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Update admin_notes last_updated_at
  UPDATE admin_notes 
  SET last_updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update interviews last_updated_at
  UPDATE interviews 
  SET last_updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- 6. Update the get_users_by_stage_with_rejected function to include last_updated_at
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
    COALESCE(us.total_session_time_minutes, 0) as total_session_time_minutes,
    us.created_at as stage_updated_at,
    us.last_updated_at,
    i.interview_name as upcoming_interview_name,
    i.scheduled_date as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  LEFT JOIN LATERAL (
    SELECT interview_name, scheduled_date
    FROM interviews 
    WHERE user_id = p.id 
    AND status = 'scheduled' 
    AND scheduled_date >= NOW()
    ORDER BY scheduled_date ASC
    LIMIT 1
  ) i ON true
  WHERE us.stage_id = p_stage 
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY us.last_updated_at DESC;
END;
$$;

-- 7. Create trigger to automatically update last_updated_at when admin_notes are modified
CREATE OR REPLACE FUNCTION trigger_update_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user_stages last_updated_at
  UPDATE user_stages 
  SET last_updated_at = NOW()
  WHERE user_id = NEW.user_id AND is_current = true;
  
  RETURN NEW;
END;
$$;

-- 8. Create trigger for admin_notes
DROP TRIGGER IF EXISTS update_user_activity_on_notes ON admin_notes;
CREATE TRIGGER update_user_activity_on_notes
  AFTER INSERT OR UPDATE ON admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_activity();

-- 9. Create trigger for interviews
DROP TRIGGER IF EXISTS update_user_activity_on_interviews ON interviews;
CREATE TRIGGER update_user_activity_on_interviews
  AFTER INSERT OR UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_activity();

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION update_user_last_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;
