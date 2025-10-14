-- Session Tracking Database Functions
-- Run these SQL commands in your Supabase SQL editor

-- 1. Create function to update user session time
CREATE OR REPLACE FUNCTION update_user_session_time(
  user_id UUID,
  additional_minutes INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update the total_session_time_minutes in profiles table
  UPDATE profiles 
  SET 
    total_session_time_minutes = COALESCE(total_session_time_minutes, 0) + additional_minutes,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Log the session activity (optional - for analytics)
  INSERT INTO user_session_logs (user_id, session_minutes, activity_type, created_at)
  VALUES (user_id, additional_minutes, 'session_update', NOW())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 2. Create user_session_logs table for detailed tracking (optional)
CREATE TABLE IF NOT EXISTS user_session_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_minutes INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL DEFAULT 'session_update',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_session_logs_user_id 
ON user_session_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_session_logs_created_at 
ON user_session_logs(created_at DESC);

-- 4. Create function to get user session statistics
CREATE OR REPLACE FUNCTION get_user_session_stats(user_id UUID)
RETURNS TABLE (
  total_minutes INTEGER,
  sessions_today INTEGER,
  avg_session_minutes DECIMAL,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.total_session_time_minutes, 0) as total_minutes,
    COUNT(usl.id) as sessions_today,
    COALESCE(AVG(usl.session_minutes), 0) as avg_session_minutes,
    p.last_activity_at as last_activity
  FROM profiles p
  LEFT JOIN user_session_logs usl ON p.id = usl.user_id 
    AND usl.created_at >= CURRENT_DATE
  WHERE p.id = user_id
  GROUP BY p.total_session_time_minutes, p.last_activity_at;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to reset session time (admin only)
CREATE OR REPLACE FUNCTION reset_user_session_time(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    total_session_time_minutes = 0,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Clear session logs for this user
  DELETE FROM user_session_logs WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Add RLS policies for user_session_logs
ALTER TABLE user_session_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own session logs
CREATE POLICY "Users can view own session logs" ON user_session_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own session logs
CREATE POLICY "Users can insert own session logs" ON user_session_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all session logs
CREATE POLICY "Admins can view all session logs" ON user_session_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 7. Create view for admin dashboard session analytics
CREATE OR REPLACE VIEW admin_session_analytics AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.total_session_time_minutes,
  p.last_activity_at,
  COUNT(usl.id) as total_sessions,
  AVG(usl.session_minutes) as avg_session_minutes,
  MAX(usl.created_at) as last_session_log
FROM profiles p
LEFT JOIN user_session_logs usl ON p.id = usl.user_id
GROUP BY p.id, p.email, p.full_name, p.role, p.total_session_time_minutes, p.last_activity_at;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_session_time(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_session_time(UUID) TO authenticated;
GRANT SELECT ON admin_session_analytics TO authenticated;

