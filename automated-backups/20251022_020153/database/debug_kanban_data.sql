-- Debug script to check what data is being returned for Kanban users
-- This will help identify where the "0" is coming from

-- Check the get_users_by_stage_with_rejected function output
SELECT 'Testing get_users_by_stage_with_rejected function:' as info;
SELECT 
  user_id,
  email,
  full_name,
  role,
  incomplete_tasks_count,
  upcoming_interview_name,
  upcoming_interview_date
FROM get_users_by_stage_with_rejected('Interested', false) 
LIMIT 5;

-- Check if there are any users with incomplete_tasks_count = 0
SELECT 'Users with incomplete_tasks_count = 0:' as info;
SELECT 
  p.email,
  p.full_name,
  (SELECT COUNT(*) FROM admin_notes an WHERE an.user_id = p.id AND an.note_type = 'todo' AND an.is_completed = false) as incomplete_tasks_count
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested' 
AND us.is_current = true
ORDER BY p.created_at DESC;

-- Check if there are any other numeric fields that might be showing as "0"
SELECT 'All numeric fields for users:' as info;
SELECT 
  p.email,
  p.full_name,
  p.total_session_time_minutes,
  (SELECT COUNT(*) FROM admin_notes an WHERE an.user_id = p.id AND an.note_type = 'todo' AND an.is_completed = false) as incomplete_tasks_count,
  (SELECT COUNT(*) FROM admin_notes an WHERE an.user_id = p.id AND an.note_type = 'note') as total_notes_count
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested' 
AND us.is_current = true
ORDER BY p.created_at DESC;
