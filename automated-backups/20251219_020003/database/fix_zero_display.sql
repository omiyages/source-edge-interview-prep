-- Fix the "0" appearing next to user names in Kanban cards
-- This script will identify and fix the source of the "0"

-- 1. Check what's actually in the full_name field
SELECT 'Checking full_name fields:' as info;
SELECT 
  id,
  email,
  full_name,
  LENGTH(full_name) as name_length,
  POSITION('0' IN full_name) as zero_position
FROM profiles 
WHERE full_name ILIKE '%0%'
ORDER BY created_at DESC;

-- 2. Check if there are any users with "0" in their names
SELECT 'Users with 0 in name:' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  position
FROM profiles 
WHERE full_name ILIKE '%0%'
ORDER BY created_at DESC;

-- 3. Update any names that contain "0" to remove it
UPDATE profiles 
SET full_name = TRIM(REPLACE(full_name, '0', ''))
WHERE full_name ILIKE '%0%'
AND full_name != TRIM(REPLACE(full_name, '0', ''));

-- 4. Check the get_users_by_stage_with_rejected function output
SELECT 'Function output check:' as info;
SELECT 
  user_id,
  email,
  full_name,
  incomplete_tasks_count,
  upcoming_interview_name
FROM get_users_by_stage_with_rejected('Interested', false) 
LIMIT 3;

-- 5. If the issue persists, let's check if there's a different field being concatenated
SELECT 'All fields for debugging:' as info;
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.position,
  us.stage,
  (SELECT COUNT(*) FROM admin_notes an WHERE an.user_id = p.id AND an.note_type = 'todo' AND an.is_completed = false) as incomplete_tasks_count
FROM profiles p
JOIN user_stages us ON p.id = us.user_id
WHERE us.stage = 'Interested' 
AND us.is_current = true
ORDER BY p.created_at DESC
LIMIT 3;
