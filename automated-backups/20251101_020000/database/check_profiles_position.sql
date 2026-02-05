-- Check if position field exists in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'position';

-- If position field doesn't exist, add it
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position VARCHAR(255);

-- Check current profiles data
SELECT id, email, full_name, role, position
FROM profiles 
LIMIT 5;
