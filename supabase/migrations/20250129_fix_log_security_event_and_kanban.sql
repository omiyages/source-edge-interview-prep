-- Fix log_security_event function and add per-admin kanban board support
-- Run this migration to fix the admin role change issue

-- 1. Ensure enhanced_security_events table exists
CREATE TABLE IF NOT EXISTS public.enhanced_security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  user_email text,
  user_agent text,
  ip_address inet,
  resource_accessed text,
  action_attempted text,
  success boolean NOT NULL DEFAULT false,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on enhanced security events
ALTER TABLE public.enhanced_security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
DROP POLICY IF EXISTS "Admins can view security events" ON public.enhanced_security_events;
CREATE POLICY "Admins can view security events" 
ON public.enhanced_security_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- System can insert security events
DROP POLICY IF EXISTS "System can insert security events" ON public.enhanced_security_events;
CREATE POLICY "System can insert security events" 
ON public.enhanced_security_events 
FOR INSERT 
WITH CHECK (true);

-- 2. Create or replace the log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_user_email text DEFAULT NULL,
  p_resource_accessed text DEFAULT NULL,
  p_action_attempted text DEFAULT NULL,
  p_success boolean DEFAULT false,
  p_risk_level text DEFAULT 'low',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  INSERT INTO public.enhanced_security_events (
    event_type,
    user_id,
    user_email,
    resource_accessed,
    action_attempted,
    success,
    risk_level,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_user_email,
    p_resource_accessed,
    p_action_attempted,
    p_success,
    p_risk_level,
    p_metadata
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the calling operation
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;

-- 3. Add admin_id column to user_stages table for per-admin kanban boards
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stages' 
    AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE public.user_stages 
    ADD COLUMN admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Create index for admin_id
    CREATE INDEX IF NOT EXISTS idx_user_stages_admin_id 
    ON public.user_stages(admin_id);
    
    -- Add comment explaining the column
    COMMENT ON COLUMN public.user_stages.admin_id IS 
    'Admin user who owns this kanban board entry. NULL means visible to all admins.';
  END IF;
END $$;

-- 4. Drop ALL old versions of the function first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(text, boolean, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(varchar, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_by_stage_with_rejected(varchar, boolean, uuid) CASCADE;

-- 5. Update the get_users_by_stage_with_rejected function to support per-admin views
CREATE OR REPLACE FUNCTION public.get_users_by_stage_with_rejected(
  p_stage_name text,
  p_show_rejected boolean DEFAULT false,
  p_admin_id uuid DEFAULT NULL
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
DECLARE
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- If admin_id is NULL, use the current admin's ID
  IF p_admin_id IS NULL THEN
    p_admin_id := v_current_user_id;
  END IF;
  
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
    AND (p_admin_id IS NULL OR us.admin_id IS NULL OR us.admin_id = p_admin_id)
    AND (p_show_rejected = true OR ur.rejected_at IS NULL)
  ORDER BY COALESCE(us.updated_at, us.created_at) DESC;
END;
$$;

-- 6. Drop ALL old versions of move_user_to_stage to avoid conflicts
DROP FUNCTION IF EXISTS public.move_user_to_stage CASCADE;
DROP FUNCTION IF EXISTS public.move_user_to_stage(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.move_user_to_stage(uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.move_user_to_stage(uuid, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.move_user_to_stage(uuid, text, uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.move_user_to_stage(uuid, varchar, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.move_user_to_stage(uuid, varchar, uuid, text) CASCADE;

-- 7. Update the move_user_to_stage function to support per-admin boards
CREATE OR REPLACE FUNCTION public.move_user_to_stage(
  p_user_id uuid,
  p_new_stage_name text,
  p_transitioned_by uuid DEFAULT auth.uid(),
  p_notes text DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_old_stage text;
  v_current_user_id uuid;
  v_current_user_role text;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if user is admin
  SELECT role INTO v_current_user_role
  FROM public.profiles
  WHERE id = v_current_user_id;
  
  IF v_current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  
  -- If admin_id is NULL, use the current admin's ID
  IF p_admin_id IS NULL THEN
    p_admin_id := v_current_user_id;
  END IF;
  
  -- Get old stage
  SELECT stage INTO v_old_stage
  FROM public.user_stages
  WHERE user_id = p_user_id
    AND is_active = true
    AND (admin_id = p_admin_id OR admin_id IS NULL)
  LIMIT 1;
  
  -- Deactivate current stage for this admin
  UPDATE public.user_stages
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id 
    AND is_active = true
    AND (admin_id = p_admin_id OR admin_id IS NULL);
  
  -- Insert new stage or reactivate existing
  INSERT INTO public.user_stages (user_id, stage, is_active, admin_id)
  VALUES (p_user_id, p_new_stage_name, true, p_admin_id)
  ON CONFLICT (user_id, stage) 
  DO UPDATE SET is_active = true, updated_at = now(), admin_id = EXCLUDED.admin_id;
  
  -- Log transition
  INSERT INTO public.stage_transitions (
    user_id,
    from_stage,
    to_stage,
    transitioned_by,
    notes
  ) VALUES (
    p_user_id,
    v_old_stage,
    p_new_stage_name,
    p_transitioned_by,
    p_notes
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_by_stage_with_rejected TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_user_to_stage TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.log_security_event IS 
'Logs security events for audit and monitoring purposes. Safe to call - errors are logged but do not fail the calling operation.';
