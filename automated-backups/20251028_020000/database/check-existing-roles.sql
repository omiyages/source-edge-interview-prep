-- Check existing roles in profiles table
SELECT DISTINCT role, COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;
