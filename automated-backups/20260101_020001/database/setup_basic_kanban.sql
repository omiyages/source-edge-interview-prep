-- Setup Basic Kanban Structure
-- Run this SQL in your Supabase SQL Editor

-- 1. Check if user_stages table exists and what columns it has
SELECT 'Checking user_stages table structure...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_stages'
ORDER BY ordinal_position;

-- 2. Create user_stages table if it doesn't exist or add missing columns
CREATE TABLE IF NOT EXISTS user_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  is_current BOOLEAN DEFAULT true,
  transitioned_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_session_time_minutes INTEGER DEFAULT 0
);

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add is_current column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_stages' AND column_name = 'is_current') THEN
    ALTER TABLE user_stages ADD COLUMN is_current BOOLEAN DEFAULT true;
  END IF;
  
  -- Add transitioned_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_stages' AND column_name = 'transitioned_by') THEN
    ALTER TABLE user_stages ADD COLUMN transitioned_by UUID REFERENCES profiles(id);
  END IF;
  
  -- Add notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_stages' AND column_name = 'notes') THEN
    ALTER TABLE user_stages ADD COLUMN notes TEXT;
  END IF;
  
  -- Add total_session_time_minutes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_stages' AND column_name = 'total_session_time_minutes') THEN
    ALTER TABLE user_stages ADD COLUMN total_session_time_minutes INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. Create stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert default stages if they don't exist
INSERT INTO stages (name, order_index) VALUES 
  ('Interested', 1),
  ('Scheduled', 2),
  ('CV Sent', 3),
  ('1st Interview', 4),
  ('2nd Interview', 5),
  ('3rd Interview+', 6),
  ('Debrief', 7),
  ('Offer', 8),
  ('Offer Accepted', 9)
ON CONFLICT (name) DO NOTHING;

-- 6. Create stage_transitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS stage_transitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_stage UUID REFERENCES stages(id),
  to_stage UUID NOT NULL REFERENCES stages(id),
  transitioned_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create user_rejections table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_rejections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rejected_by UUID REFERENCES profiles(id),
  reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on all tables
ALTER TABLE user_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rejections ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- User stages policies
CREATE POLICY "Admins can manage all user_stages" ON user_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Stages policies
CREATE POLICY "Everyone can view stages" ON stages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stages" ON stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Stage transitions policies
CREATE POLICY "Admins can manage stage_transitions" ON stage_transitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- User rejections policies
CREATE POLICY "Admins can manage user_rejections" ON user_rejections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stage_transitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_rejections TO authenticated;

-- 11. Create the working function
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
    NULL::TEXT as upcoming_interview_name,
    NULL::TIMESTAMP WITH TIME ZONE as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected
  FROM profiles p
  JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  WHERE us.stage_id = p_stage 
  AND us.is_current = true
  AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY us.created_at DESC;
END;
$$;

-- 12. Grant function permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;

-- 13. Test the setup
SELECT 'Basic Kanban setup completed' as status;
SELECT COUNT(*) as stages_count FROM stages;
SELECT COUNT(*) as user_stages_count FROM user_stages;
