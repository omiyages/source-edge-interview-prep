-- Setup Interviews Table and Functions
-- Run this SQL in your Supabase SQL Editor

-- 1. Create interviews table
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
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_by ON interviews(created_by);

-- 3. Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
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

-- 5. Create function to get upcoming interview for a user
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

-- 6. Create function to get most recent interview for a user
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

-- 7. Create function to get all interviews for a user
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

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION get_upcoming_interview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_recent_interview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_interviews(UUID) TO authenticated;

-- 9. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON interviews TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
