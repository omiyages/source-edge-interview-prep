-- Test Kanban Function - Simple Test
-- Run this SQL in your Supabase SQL Editor

-- 1. First, let's see what stages exist
SELECT 'Available stages:' as status;
SELECT id, name, order_index FROM stages ORDER BY order_index;

-- 2. Let's see what users exist in user_stages
SELECT 'Users in stages:' as status;
SELECT 
  us.user_id,
  us.stage_id,
  us.is_current,
  p.email,
  s.name as stage_name
FROM user_stages us
JOIN profiles p ON us.user_id = p.id
JOIN stages s ON us.stage_id = s.id
WHERE us.is_current = true
ORDER BY s.order_index;

-- 3. Test the function with a specific stage
SELECT 'Testing function call:' as status;

-- Test with the first stage
SELECT * FROM get_users_by_stage_with_rejected(
  (SELECT id FROM stages ORDER BY order_index LIMIT 1), 
  false
);

-- 4. If no users are in stages, let's add a test user to a stage
SELECT 'Adding test user to stage if needed:' as status;

-- Check if we have any users in stages
DO $$
DECLARE
    user_count INTEGER;
    stage_id UUID;
    user_id UUID;
BEGIN
    -- Count users in stages
    SELECT COUNT(*) INTO user_count FROM user_stages WHERE is_current = true;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users in stages. Adding a test user...';
        
        -- Get first stage
        SELECT id INTO stage_id FROM stages ORDER BY order_index LIMIT 1;
        
        -- Get first user
        SELECT id INTO user_id FROM profiles LIMIT 1;
        
        IF stage_id IS NOT NULL AND user_id IS NOT NULL THEN
            -- Add user to stage
            INSERT INTO user_stages (user_id, stage_id, is_current)
            VALUES (user_id, stage_id, true);
            
            RAISE NOTICE 'Added user % to stage %', user_id, stage_id;
        ELSE
            RAISE NOTICE 'No stages or users found to add';
        END IF;
    ELSE
        RAISE NOTICE 'Found % users already in stages', user_count;
    END IF;
END $$;

-- 5. Test the function again after adding user
SELECT 'Testing function after adding user:' as status;
SELECT * FROM get_users_by_stage_with_rejected(
  (SELECT id FROM stages ORDER BY order_index LIMIT 1), 
  false
);

SELECT 'Test completed.' as status;