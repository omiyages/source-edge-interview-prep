-- Kanban Board Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- 1. Create user_stages table to track user progress through interview stages
CREATE TABLE IF NOT EXISTS user_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, stage)
);

-- 2. Create stage_transitions table to track when users move between stages
CREATE TABLE IF NOT EXISTS stage_transitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transitioned_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- 3. Create admin_notes table for user-specific notes and to-do items
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('note', 'todo')),
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_rejections table to track rejected users
CREATE TABLE IF NOT EXISTS user_rejections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rejected_by UUID NOT NULL REFERENCES profiles(id),
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  UNIQUE(user_id)
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stages_user_id ON user_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stages_stage ON user_stages(stage);
CREATE INDEX IF NOT EXISTS idx_user_stages_active ON user_stages(is_active);
CREATE INDEX IF NOT EXISTS idx_stage_transitions_user_id ON stage_transitions(user_id);
CREATE INDEX IF NOT EXISTS idx_stage_transitions_date ON stage_transitions(transitioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON admin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_type ON admin_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_user_rejections_user_id ON user_rejections(user_id);

-- 6. Create function to move user to a new stage
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

-- 7. Create function to get user's current stage
CREATE OR REPLACE FUNCTION get_user_current_stage(p_user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  current_stage VARCHAR(50);
BEGIN
  SELECT stage INTO current_stage 
  FROM user_stages 
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN COALESCE(current_stage, 'Interested');
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get users by stage
CREATE OR REPLACE FUNCTION get_users_by_stage(p_stage VARCHAR(50))
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    COALESCE(p.position, p.role) as role, -- Use position if available, fallback to role
    p.last_activity_at,
    p.total_session_time_minutes,
    us.updated_at as stage_updated_at
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage = p_stage 
    AND us.is_active = true
    AND ur.user_id IS NULL
  ORDER BY us.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to reject a user
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_rejected_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Deactivate current stage
  UPDATE user_stages 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Record rejection
  INSERT INTO user_rejections (user_id, rejected_by, reason)
  VALUES (p_user_id, p_rejected_by, p_reason)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 10. Add RLS policies
ALTER TABLE user_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rejections ENABLE ROW LEVEL SECURITY;

-- Admins can manage all user stages
CREATE POLICY "Admins can manage user stages" ON user_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can view all stage transitions
CREATE POLICY "Admins can view stage transitions" ON stage_transitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can manage admin notes
CREATE POLICY "Admins can manage admin notes" ON admin_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can manage user rejections
CREATE POLICY "Admins can manage user rejections" ON user_rejections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 11. Grant permissions
GRANT EXECUTE ON FUNCTION move_user_to_stage(UUID, VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_current_stage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_stage(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID, TEXT) TO authenticated;

