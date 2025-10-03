-- Add position field to profiles table for job titles/roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position TEXT;

-- Create index for position field for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_position ON public.profiles(position);

-- Update the comment to clarify the difference between role and position
COMMENT ON COLUMN public.profiles.role IS 'Authentication role: user or admin';
COMMENT ON COLUMN public.profiles.position IS 'Job position/title: Software Engineer, Product Manager, etc.';
