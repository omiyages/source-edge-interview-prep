-- Diagnostic script to check information fields
-- Run this in Supabase SQL Editor

-- Check if all information columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'linkedin_url', 'current_salary', 'expected_salary', 'notice_period', 
  'current_company', 'current_job_title', 'location', 'japanese_proficiency', 'years_of_experience'
)
ORDER BY column_name;

-- Check if there's any data in the information fields
SELECT 
  id, 
  email, 
  linkedin_url, 
  current_company, 
  current_job_title,
  location,
  japanese_proficiency,
  years_of_experience
FROM profiles 
WHERE linkedin_url IS NOT NULL 
   OR current_company IS NOT NULL 
   OR current_job_title IS NOT NULL
   OR location IS NOT NULL
   OR japanese_proficiency IS NOT NULL
   OR years_of_experience IS NOT NULL
LIMIT 5;
