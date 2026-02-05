-- Test script to verify information fields are working
-- Run this in Supabase SQL Editor

-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('linkedin_url', 'current_salary', 'expected_salary', 'notice_period', 'current_company', 'current_job_title')
ORDER BY column_name;

-- Test updating a profile (replace with actual user ID)
-- UPDATE profiles 
-- SET linkedin_url = 'https://linkedin.com/in/test',
--     current_company = 'Test Company',
--     current_job_title = 'Test Title'
-- WHERE id = 'your-user-id-here';

-- Check current data in profiles table
SELECT id, email, full_name, linkedin_url, current_company, current_job_title
FROM profiles 
WHERE linkedin_url IS NOT NULL 
OR current_company IS NOT NULL 
OR current_job_title IS NOT NULL
LIMIT 5;
