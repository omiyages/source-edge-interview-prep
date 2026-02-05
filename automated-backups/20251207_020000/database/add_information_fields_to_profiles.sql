-- Add information fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS current_salary TEXT,
ADD COLUMN IF NOT EXISTS expected_salary TEXT,
ADD COLUMN IF NOT EXISTS notice_period TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.current_salary IS 'Current salary information';
COMMENT ON COLUMN public.profiles.expected_salary IS 'Expected salary for new role';
COMMENT ON COLUMN public.profiles.notice_period IS 'Notice period for current job';
COMMENT ON COLUMN public.profiles.current_company IS 'Current company name';
COMMENT ON COLUMN public.profiles.current_job_title IS 'Current job title';

-- Update the get_users_by_stage_with_rejected function to include these fields
CREATE OR REPLACE FUNCTION get_users_by_stage_with_rejected(
  p_stage_name VARCHAR,
  p_show_rejected BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  "position" VARCHAR,
  company VARCHAR,
  last_activity_at TIMESTAMPTZ,
  total_session_time_minutes INTEGER,
  stage_updated_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  upcoming_interview_name TEXT,
  upcoming_interview_date TIMESTAMPTZ,
  is_rejected BOOLEAN,
  incomplete_tasks_count INTEGER,
  linkedin_url TEXT,
  current_salary TEXT,
  expected_salary TEXT,
  notice_period TEXT,
  current_company TEXT,
  current_job_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email::TEXT,
    p.full_name::TEXT,
    p.role::TEXT,
    p."position"::VARCHAR,
    COALESCE(p.company, '')::VARCHAR,
    p.updated_at as last_activity_at,
    COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
    us.updated_at as stage_updated_at,
    us.updated_at as last_updated_at,
    i.interview_name::TEXT as upcoming_interview_name,
    i.scheduled_date as upcoming_interview_date,
    CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END as is_rejected,
    COALESCE(task_count.incomplete_tasks, 0) as incomplete_tasks_count,
    p.linkedin_url::TEXT,
    p.current_salary::TEXT,
    p.expected_salary::TEXT,
    p.notice_period::TEXT,
    p.current_company::TEXT,
    p.current_job_title::TEXT
  FROM profiles p
  INNER JOIN user_stages us ON p.id = us.user_id
  LEFT JOIN user_rejections ur ON p.id = ur.user_id
  LEFT JOIN LATERAL (
    SELECT interview_name, scheduled_date
    FROM interviews 
    WHERE interviews.user_id = p.id 
    AND scheduled_date > NOW()
    ORDER BY scheduled_date ASC 
    LIMIT 1
  ) i ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER as incomplete_tasks
    FROM admin_notes 
    WHERE admin_notes.user_id = p.id 
    AND note_type = 'todo' 
    AND is_completed = FALSE
  ) task_count ON TRUE
  WHERE us.stage = p_stage_name
  AND (p_show_rejected = TRUE OR ur.id IS NULL)
  ORDER BY us.updated_at DESC;
END;
$$;
