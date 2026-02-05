-- Fix existing Kanban users by setting default company values
-- This addresses the issue where users were created before company field existed

-- 1. First, let's see the current state
SELECT 
    'Before Fix' as status,
    COUNT(*) as total_kanban_users,
    COUNT(CASE WHEN p.company IS NULL THEN 1 END) as users_with_null_company,
    COUNT(CASE WHEN p.company IS NOT NULL THEN 1 END) as users_with_company
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true;

-- 2. Set all existing Kanban users to have a default company
UPDATE profiles 
SET 
    company = 'Woven by Toyota',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT p.id
    FROM profiles p
    INNER JOIN user_stages us ON p.id = us.user_id
    WHERE us.is_active = true
    AND (p.company IS NULL OR p.company = '')
);

-- 3. Verify the update
SELECT 
    'After Fix' as status,
    COUNT(*) as total_kanban_users,
    COUNT(CASE WHEN p.company IS NULL THEN 1 END) as users_with_null_company,
    COUNT(CASE WHEN p.company IS NOT NULL THEN 1 END) as users_with_company,
    COUNT(CASE WHEN p.company = 'Woven by Toyota' THEN 1 END) as users_with_woven_company
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true;

-- 4. Test the function with a specific stage
SELECT 'Testing function for Interested stage:' as test;
SELECT * FROM get_users_by_stage_with_rejected('Interested', true) LIMIT 3;

-- 5. Check if there are any users in user_stages at all
SELECT 'User stages check:' as check;
SELECT stage, COUNT(*) as user_count
FROM user_stages 
WHERE is_active = true
GROUP BY stage
ORDER BY user_count DESC;

-- 6. If still no users, let's check if the function is working at all
SELECT 'Direct query test:' as test;
SELECT p.id, p.email, p.full_name, p."position", p.company, us.stage
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true
AND us.stage = 'Interested'
LIMIT 5;
