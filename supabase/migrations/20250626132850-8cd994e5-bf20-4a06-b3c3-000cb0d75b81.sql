
-- Add columns to profiles table for better user management
ALTER TABLE public.profiles 
ADD COLUMN full_name TEXT,
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_session_time_minutes INTEGER DEFAULT 0,
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create user sessions table to track user activity
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles policies to allow admin management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update last login time
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger to update last login on auth
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE PROCEDURE public.update_last_login();

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_profiles_last_login ON public.profiles(last_login_at);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
