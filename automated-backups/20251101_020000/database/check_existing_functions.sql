-- Check Existing Functions (Supabase Compatible)
-- Run this SQL in your Supabase SQL Editor to see what functions exist

-- 1. List all functions with similar names
SELECT 
  proname as function_name,
  prokind as function_type,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname LIKE '%get_users_by_stage%'
ORDER BY proname;

-- 2. Check function parameters
SELECT 
  p.proname as function_name,
  pa.paramname as parameter_name,
  pa.paramtype::regtype as parameter_type,
  pa.paramnum as parameter_position
FROM pg_proc p
LEFT JOIN pg_proc_arguments pa ON p.oid = pa.proname
WHERE p.proname LIKE '%get_users_by_stage%'
ORDER BY p.proname, pa.paramnum;

-- 3. Test if any function works
SELECT 'Testing function call...' as status;

-- Try to call the function (this might fail, but will show the error)
SELECT * FROM get_users_by_stage_with_rejected(
  (SELECT id FROM stages LIMIT 1), 
  false
) LIMIT 1;