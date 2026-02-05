-- Add additional information fields to profiles table
-- Run this in Supabase SQL Editor

-- Add the new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS japanese_proficiency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN public.profiles.location IS 'User location (e.g., Tokyo, Japan)';
COMMENT ON COLUMN public.profiles.japanese_proficiency IS 'Japanese language proficiency level';
COMMENT ON COLUMN public.profiles.years_of_experience IS 'Years of professional experience';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('location', 'japanese_proficiency', 'years_of_experience')
ORDER BY column_name;
