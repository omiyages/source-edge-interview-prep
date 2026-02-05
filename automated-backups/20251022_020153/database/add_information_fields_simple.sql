-- Simple script to add information fields to profiles table
-- Run this in the Supabase SQL Editor

-- Add the columns one by one
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_salary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notice_period TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_job_title TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('linkedin_url', 'current_salary', 'expected_salary', 'notice_period', 'current_company', 'current_job_title')
ORDER BY column_name;
