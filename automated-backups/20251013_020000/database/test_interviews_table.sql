-- Test the interviews table structure and data
-- Run this in your Supabase SQL Editor

-- 1. Check if interviews table exists and its structure
SELECT 'Interviews table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'interviews'
ORDER BY ordinal_position;

-- 2. Check if there are any interviews
SELECT 'Sample interviews data:' as info;
SELECT * FROM interviews LIMIT 5;

-- 3. Check upcoming interviews
SELECT 'Upcoming interviews:' as info;
SELECT id, user_id, interview_name, scheduled_date, created_at
FROM interviews 
WHERE scheduled_date >= NOW()
ORDER BY scheduled_date ASC
LIMIT 10;

-- 4. Check if there are any interviews with user details
SELECT 'Interviews with user details:' as info;
SELECT 
    i.id,
    i.user_id,
    i.interview_name,
    i.scheduled_date,
    p.full_name,
    p.email,
    p.position
FROM interviews i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.scheduled_date >= NOW()
ORDER BY i.scheduled_date ASC
LIMIT 10;
