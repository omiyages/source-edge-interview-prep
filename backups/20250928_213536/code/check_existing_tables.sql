-- Check Existing Tables in Database
-- Run this SQL in your Supabase SQL Editor

-- 1. List all tables in the public schema
SELECT 'All tables in public schema:' as status;
SELECT 
  schemaname, 
  tablename, 
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all tables that might be related to kanban/stages
SELECT 'Tables with kanban/stage related names:' as status;
SELECT 
  schemaname, 
  tablename, 
  tableowner
FROM pg_tables 
WHERE tablename ILIKE '%stage%' 
   OR tablename ILIKE '%kanban%'
   OR tablename ILIKE '%user%'
   OR tablename ILIKE '%profile%'
ORDER BY tablename;

-- 3. Check if there are any functions related to stages
SELECT 'Functions related to stages:' as status;
SELECT 
  proname as function_name,
  oidvectortypes(proargtypes) as parameters,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname ILIKE '%stage%' 
   OR proname ILIKE '%kanban%'
   OR proname ILIKE '%user%'
ORDER BY proname;

-- 4. Check if there are any views
SELECT 'Views in public schema:' as status;
SELECT 
  schemaname, 
  viewname, 
  viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 5. Check if there are any sequences
SELECT 'Sequences in public schema:' as status;
SELECT 
  schemaname, 
  sequencename, 
  sequenceowner
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;

SELECT 'Table check completed.' as status;
