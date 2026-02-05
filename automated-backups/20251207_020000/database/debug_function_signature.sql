-- Debug: Check what functions exist and their signatures
SELECT 
    routine_name,
    routine_type,
    data_type,
    parameter_name,
    parameter_mode,
    ordinal_position
FROM information_schema.routines 
LEFT JOIN information_schema.parameters 
    ON routines.specific_name = parameters.specific_name
WHERE routine_name = 'move_user_to_stage'
ORDER BY routine_name, ordinal_position;

-- Check if the function exists at all
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'move_user_to_stage';
