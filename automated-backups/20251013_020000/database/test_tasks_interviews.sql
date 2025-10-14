-- Test for tasks and interviews in the database
-- Run this in your Supabase SQL Editor

-- 1. Check admin_notes table for tasks
SELECT 'Admin notes (tasks):' as info;
SELECT user_id, note_type, is_completed, created_at
FROM admin_notes 
WHERE note_type = 'todo'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check interviews table
SELECT 'Interviews:' as info;
SELECT user_id, interview_name, scheduled_date, created_at
FROM interviews 
WHERE scheduled_date > NOW()
ORDER BY scheduled_date ASC
LIMIT 10;

-- 3. Check incomplete tasks count
SELECT 'Incomplete tasks by user:' as info;
SELECT user_id, COUNT(*) as incomplete_tasks
FROM admin_notes 
WHERE note_type = 'todo' AND is_completed = FALSE
GROUP BY user_id
ORDER BY incomplete_tasks DESC;

-- 4. Check upcoming interviews by user
SELECT 'Upcoming interviews by user:' as info;
SELECT user_id, COUNT(*) as upcoming_interviews
FROM interviews 
WHERE scheduled_date > NOW()
GROUP BY user_id
ORDER BY upcoming_interviews DESC;
