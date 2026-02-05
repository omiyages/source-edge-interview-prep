-- Fix the move_user_to_stage function to properly move users instead of creating duplicates
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function with proper logic
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
DECLARE
    current_stage VARCHAR;
BEGIN
    -- Get the current stage for this user
    SELECT stage INTO current_stage 
    FROM user_stages 
    WHERE user_id = p_user_id;
    
    -- If user is not in any stage, create new entry
    IF current_stage IS NULL THEN
        INSERT INTO user_stages (user_id, stage, created_at, updated_at)
        VALUES (p_user_id, p_new_stage_name, NOW(), NOW());
        
        -- Log the transition
        INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes, created_at)
        VALUES (p_user_id, 'New', p_new_stage_name, p_transitioned_by, p_notes, NOW());
        
        RETURN TRUE;
    ELSE
        -- User is already in a stage, update the existing entry
        UPDATE user_stages 
        SET stage = p_new_stage_name, updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Log the transition
        INSERT INTO stage_transitions (user_id, from_stage, to_stage, transitioned_by, notes, created_at)
        VALUES (p_user_id, current_stage, p_new_stage_name, p_transitioned_by, p_notes, NOW());
        
        RETURN TRUE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
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
