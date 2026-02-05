-- Debug profiles table structure and existing data
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing profiles
SELECT id, full_name, email, role, position, created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
