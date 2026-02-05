-- Fix missing update_user_session_time function
-- This function is called by the session tracking hook

CREATE OR REPLACE FUNCTION update_user_session_time(
  additional_minutes INTEGER,
  user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's total session time
  UPDATE profiles 
  SET 
    total_session_time_minutes = COALESCE(total_session_time_minutes, 0) + additional_minutes,
    last_login_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_session_time(INTEGER, UUID) TO authenticated;
