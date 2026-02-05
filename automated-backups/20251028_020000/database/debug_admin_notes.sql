-- Debug script to check admin_notes table and data

-- 1. Check if admin_notes table exists and its structure
SELECT 'admin_notes table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_notes'
ORDER BY ordinal_position;

-- 2. Check if there are any records in admin_notes
SELECT 'admin_notes records count:' as info;
SELECT COUNT(*) as total_records FROM admin_notes;

-- 3. Check recent admin_notes records
SELECT 'Recent admin_notes records:' as info;
SELECT 
  id,
  user_id,
  note_type,
  content,
  is_completed,
  created_at,
  created_by
FROM admin_notes 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check if there are any todos specifically
SELECT 'Todo records:' as info;
SELECT 
  id,
  user_id,
  note_type,
  content,
  is_completed,
  created_at
FROM admin_notes 
WHERE note_type = 'todo'
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if there are any notes specifically
SELECT 'Note records:' as info;
SELECT 
  id,
  user_id,
  note_type,
  content,
  is_completed,
  created_at
FROM admin_notes 
WHERE note_type = 'note'
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check if the table has the right columns
SELECT 'Checking for required columns:' as info;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notes' AND column_name = 'id') THEN '✅ id' ELSE '❌ id' END as id_column,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notes' AND column_name = 'user_id') THEN '✅ user_id' ELSE '❌ user_id' END as user_id_column,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notes' AND column_name = 'note_type') THEN '✅ note_type' ELSE '❌ note_type' END as note_type_column,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notes' AND column_name = 'content') THEN '✅ content' ELSE '❌ content' END as content_column,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notes' AND column_name = 'is_completed') THEN '✅ is_completed' ELSE '❌ is_completed' END as is_completed_column,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_notes' AND column_name = 'created_at') THEN '✅ created_at' ELSE '❌ created_at' END as created_at_column;
