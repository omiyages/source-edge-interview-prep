-- Optimize Kanban performance with single query
-- Run this in Supabase SQL Editor

-- Create an optimized function that loads all Kanban data in one query
CREATE OR REPLACE FUNCTION get_kanban_data_optimized(p_show_rejected BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  "position" VARCHAR,
  company VARCHAR,
  stage_name VARCHAR,
  last_activity_at TIMESTAMPTZ,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  upcoming_interview_name TEXT,
  upcoming_interview_date TIMESTAMPTZ,
  is_rejected BOOLEAN,
  incomplete_tasks_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.role,
    p."position",
    p.company,
    COALESCE(s.stage_name, 'Interested') as stage_name,
    p.last_activity_at,
    p.total_session_time_minutes,
    us.updated_at as stage_updated_at,
    GREATEST(
      COALESCE(p.updated_at, p.created_at),
      COALESCE(us.updated_at, p.created_at),
      COALESCE(an.updated_at, p.created_at),
      COALESCE(i.updated_at, p.created_at)
    ) as last_updated_at,
    i.interview_name::TEXT as upcoming_interview_name,
    i.interview_date as upcoming_interview_date,
    COALESCE(ur.is_rejected, FALSE) as is_rejected,
    COALESCE(task_counts.incomplete_count, 0) as incomplete_tasks_count
  FROM profiles p
  LEFT JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN stages s ON us.stage_id = s.id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as incomplete_count
    FROM admin_notes an2
    WHERE an2.user_id = p.id 
      AND an2.note_type = 'todo' 
      AND (an2.is_completed IS NULL OR an2.is_completed = FALSE)
  ) task_counts ON TRUE
  LEFT JOIN LATERAL (
    SELECT 
      i2.interview_name,
      i2.interview_date,
      i2.updated_at
    FROM interviews i2
    WHERE i2.user_id = p.id 
      AND i2.interview_date > NOW()
    ORDER BY i2.interview_date ASC
    LIMIT 1
  ) i ON TRUE
  LEFT JOIN LATERAL (
    SELECT 
      an3.updated_at
    FROM admin_notes an3
    WHERE an3.user_id = p.id
    ORDER BY an3.updated_at DESC
    LIMIT 1
  ) an ON TRUE
  WHERE 
    (p_show_rejected = TRUE OR ur.is_rejected IS NULL OR ur.is_rejected = FALSE)
    AND p.id IN (
      SELECT DISTINCT user_id 
      FROM user_stages 
      WHERE user_id IS NOT NULL
    )
  ORDER BY 
    CASE 
      WHEN s.stage_name = 'Interested' THEN 1
      WHEN s.stage_name = 'Scheduled' THEN 2
      WHEN s.stage_name = 'CV Sent' THEN 3
      WHEN s.stage_name = '1st Interview' THEN 4
      WHEN s.stage_name = '2nd Interview' THEN 5
      WHEN s.stage_name = '3rd Interview+' THEN 6
      WHEN s.stage_name = 'Debrief' THEN 7
      WHEN s.stage_name = 'Offer' THEN 8
      WHEN s.stage_name = 'Offer Accepted' THEN 9
      ELSE 10
    END,
    p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stages_user_id_stage_id ON user_stages(user_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id_type_completed ON admin_notes(user_id, note_type, is_completed);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id_date ON interviews(user_id, interview_date);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_rejections_user_id ON user_rejections(user_id);

-- Test the optimized function
SELECT COUNT(*) as total_users FROM get_kanban_data_optimized(FALSE);

-- Show sample data
SELECT * FROM get_kanban_data_optimized(FALSE) LIMIT 5;
