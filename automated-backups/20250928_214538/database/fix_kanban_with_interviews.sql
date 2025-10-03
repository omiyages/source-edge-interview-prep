-- Fix Kanban with Interviews Table
-- Run this SQL in your Supabase SQL Editor

-- 1. Create interviews table first (if not exists)
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

-- 2. Enable RLS and create policies for interviews
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

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

-- 3. Grant permissions on interviews table
GRANT SELECT, INSERT, UPDATE, DELETE ON interviews TO authenticated;

-- 4. Now create the function with interviews support
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
    COALESCE(us.last_updated_at, us.created_at) as last_updated_at,
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
  ORDER BY COALESCE(us.last_updated_at, us.created_at) DESC;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION get_users_by_stage_with_rejected(UUID, BOOLEAN) TO authenticated;

-- 6. Test the function
SELECT 'Kanban function fixed with interviews support' as status;
