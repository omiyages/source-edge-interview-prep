-- Fix the move_user_to_stage function to handle duplicates properly
-- Run this in your Supabase SQL Editor

-- Update the move_user_to_stage function to handle duplicates
DROP FUNCTION IF EXISTS move_user_to_stage(UUID, VARCHAR, UUID, TEXT);

CREATE OR REPLACE FUNCTION move_user_to_stage(
    p_user_id UUID,
    p_new_stage_name VARCHAR,
    p_transitioned_by UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, delete any existing entry for this user in any stage
    DELETE FROM user_stages WHERE user_id = p_user_id;
    
    -- Then insert the new entry
    INSERT INTO user_stages (user_id, stage, created_at, updated_at)
    VALUES (p_user_id, p_new_stage_name, NOW(), NOW());
    
    -- Log the transition
    INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes, created_at)
    VALUES (p_user_id, 'Previous Stage', p_new_stage_name, p_transitioned_by, p_notes, NOW());
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return false
        INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes, created_at)
        VALUES (p_user_id, 'Error', p_new_stage_name, p_transitioned_by, 'Error: ' || SQLERRM, NOW());
        RETURN FALSE;
END;
$$;

-- Test the function
SELECT 'Testing move_user_to_stage function:' as info;
SELECT move_user_to_stage(
    (SELECT id FROM profiles LIMIT 1),
    'Scheduled',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'Test move'
) as result;