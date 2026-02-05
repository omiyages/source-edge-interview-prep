-- Complete Kanban Interviews and Last Updated Setup (Fixed)
-- Run this SQL in your Supabase SQL Editor

-- 1. Create interviews table (if not exists)
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interview_name VARCHAR(100) NOT NULL CHECK (interview_name IN (
    'Candidate Call', 
    'HR Interview', 
    'Technical Challenge', 
    'Technical Interview', 
    'Cross Functional', 
    '2nd Technical Interview', 
    'Manager Interview'
  )),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT
);

-- 2. Add last_updated_at column to user_stages table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_stages' AND column_name = 'last_updated_at') THEN
    ALTER TABLE user_stages ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. Add last_updated_at column to admin_notes table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'admin_notes' AND column_name = 'last_updated_at') THEN
    ALTER TABLE admin_notes ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 4. Add indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_by ON interviews(created_by);
CREATE INDEX IF NOT EXISTS idx_user_stages_last_updated ON user_stages(last_updated_at);
CREATE INDEX IF NOT EXISTS idx_admin_notes_last_updated ON admin_notes(last_updated_at);

-- 5. Enable RLS (if not already enabled)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Admins can manage all interviews" ON interviews;
DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;

CREATE POLICY "Admins can manage all interviews" ON interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own interviews" ON interviews
  FOR SELECT USING (user_id = auth.uid());

-- 7. Update the move_user_to_stage function to update last_updated_at
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

-- 8. Create function to get upcoming interview for a user
CREATE OR REPLACE FUNCTION get_upcoming_interview(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  interview_name VARCHAR(100),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20),
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.interview_name,
    i.scheduled_date,
    i.status,
    i.notes
  FROM interviews i
  WHERE i.user_id = p_user_id
    AND i.status = 'scheduled'
    AND i.scheduled_date >= NOW()
  ORDER BY i.scheduled_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get most recent interview for a user
CREATE OR REPLACE FUNCTION get_most_recent_interview(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  interview_name VARCHAR(100),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20),
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.interview_name,
    i.scheduled_date,
    i.status,
    i.notes
  FROM interviews i
  WHERE i.user_id = p_user_id
  ORDER BY i.scheduled_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get all interviews for a user
CREATE OR REPLACE FUNCTION get_user_interviews(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  interview_name VARCHAR(100),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.interview_name,
    i.scheduled_date,
    i.status,
    i.notes,
    i.created_at,
    i.updated_at
  FROM interviews i
  WHERE i.user_id = p_user_id
  ORDER BY i.scheduled_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Update the get_users_by_stage_with_rejected function to include last_updated_at
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

-- 12. Create trigger to automatically update last_updated_at when admin_notes are modified
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

-- 13. Drop existing triggers if they exist and create new ones
DROP TRIGGER IF EXISTS update_user_activity_on_notes ON admin_notes;
DROP TRIGGER IF EXISTS update_user_activity_on_interviews ON interviews;

CREATE TRIGGER update_user_activity_on_notes
  AFTER INSERT OR UPDATE ON admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_activity();

CREATE TRIGGER update_user_activity_on_interviews
  AFTER INSERT OR UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_activity();

-- 14. Grant permissions
GRANT EXECUTE ON FUNCTION get_upcoming_interview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_recent_interview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_interviews(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, UUID, UUID, TEXT) TO authenticated;

-- 15. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON interviews TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
