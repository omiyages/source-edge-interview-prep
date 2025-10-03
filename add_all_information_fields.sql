-- Add ALL information fields to profiles table
-- Run this in Supabase SQL Editor

-- Add the original information fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_salary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notice_period TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_job_title TEXT;

-- Add the additional information fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS japanese_proficiency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience TEXT;

-- Add comments to document all fields
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.current_salary IS 'Current salary information';
COMMENT ON COLUMN public.profiles.expected_salary IS 'Expected salary for new role';
COMMENT ON COLUMN public.profiles.notice_period IS 'Notice period for current job';
COMMENT ON COLUMN public.profiles.current_company IS 'Current company name';
COMMENT ON COLUMN public.profiles.current_job_title IS 'Current job title';
COMMENT ON COLUMN public.profiles.location IS 'User location (e.g., Tokyo, Japan)';
COMMENT ON COLUMN public.profiles.japanese_proficiency IS 'Japanese language proficiency level';
COMMENT ON COLUMN public.profiles.years_of_experience IS 'Years of professional experience';

-- Verify all columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'linkedin_url', 'current_salary', 'expected_salary', 'notice_period', 
  'current_company', 'current_job_title', 'location', 'japanese_proficiency', 'years_of_experience'
)
ORDER BY column_name;
