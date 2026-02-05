-- Check if auth.users table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- Check existing profiles and their IDs
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
