-- Set all existing Kanban users' company to "Woven by Toyota"
-- This script updates all users who are currently in the Kanban board

-- First, let's see how many users are currently in the Kanban board
SELECT 
    COUNT(*) as total_kanban_users,
    COUNT(CASE WHEN p.company IS NULL THEN 1 END) as users_without_company,
    COUNT(CASE WHEN p.company IS NOT NULL THEN 1 END) as users_with_company
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true;

-- Update all Kanban users to have "Woven by Toyota" as their company
UPDATE profiles 
SET 
    company = 'Woven by Toyota',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT p.id
    FROM profiles p
    INNER JOIN user_stages us ON p.id = us.user_id
    WHERE us.is_active = true
);

-- Verify the update
SELECT 
    p.id,
    p.email,
    p.full_name,
    p."position",
    p.company,
    us.stage,
    p.updated_at
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true
ORDER BY p.updated_at DESC;

-- Show summary of the update
SELECT 
    COUNT(*) as total_updated_users,
    COUNT(CASE WHEN company = 'Woven by Toyota' THEN 1 END) as users_with_woven_company
FROM profiles p
INNER JOIN user_stages us ON p.id = us.user_id
WHERE us.is_active = true;
