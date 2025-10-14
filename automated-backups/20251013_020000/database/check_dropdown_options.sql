SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dropdown_options'
ORDER BY ordinal_position;

SELECT 'Sample data:' as info;
SELECT * FROM dropdown_options LIMIT 10;

SELECT 'Position entries:' as info;
SELECT * FROM dropdown_options 
WHERE value ILIKE '%engineer%' 
   OR value ILIKE '%manager%' 
   OR value ILIKE '%developer%'
   OR value ILIKE '%quality%'
   OR value ILIKE '%backend%'
   OR value ILIKE '%frontend%'
ORDER BY value;
