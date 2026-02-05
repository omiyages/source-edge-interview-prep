-- Fix the kanban function signature to match what the frontend expects
-- Run this in the Supabase SQL Editor

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(text, boolean, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(varchar, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(varchar, boolean, uuid) CASCADE;

-- Create the function with the exact signature the frontend expects
CREATE OR REPLACE FUNCTION public.get_users_by_stage_with_rejected(
  p_stage_name text,
  p_show_rejected boolean DEFAULT false
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role text,
  "position" text,
  company text,
  last_activity_at timestamptz,
  total_session_time_minutes integer,
  stage_updated_at timestamptz,
  last_updated_at timestamptz,
  upcoming_interview_name text,
  upcoming_interview_date timestamptz,
  is_rejected boolean,
  incomplete_tasks_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    COALESCE(p.full_name, '') as full_name,
    COALESCE(p.role::text, 'user') as role,
    p."position" as "position",
    p.company,
    p.last_login_at as last_activity_at,
    COALESCE(p.total_session_time_minutes, 0) as total_session_time_minutes,
    us.created_at as stage_updated_at,
    COALESCE(us.updated_at, us.created_at) as last_updated_at,
    i.interview_name as upcoming_interview_name,
    i.scheduled_date as upcoming_interview_date,
    COALESCE(ur.rejected_at IS NOT NULL, false) as is_rejected,
    COALESCE(task_count.incomplete_tasks, 0) as incomplete_tasks_count
  FROM public.profiles p
  INNER JOIN public.user_stages us ON p.id = us.user_id
  LEFT JOIN public.user_rejections ur ON p.id = ur.user_id
  LEFT JOIN LATERAL (
    SELECT interview_name, scheduled_date
    FROM public.interviews 
    WHERE interviews.user_id = p.id 
    AND scheduled_date > NOW()
    ORDER BY scheduled_date ASC 
    LIMIT 1
  ) i ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER as incomplete_tasks
    FROM public.admin_notes 
    WHERE admin_notes.user_id = p.id 
    AND note_type = 'todo' 
    AND is_completed = FALSE
  ) task_count ON TRUE
  WHERE us.stage = p_stage_name
    AND us.is_active = true
    AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_users_by_stage_with_rejected TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_users_by_stage_with_rejected IS 
'Returns users by stage with proper interview and task data for conditional coloring in kanban board.';