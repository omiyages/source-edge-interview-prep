-- Check resources count and structure
-- Run this in Supabase SQL Editor

-- Count total resources
SELECT COUNT(*) as total_resources FROM resources;

-- Show sample resources
SELECT id, title, category, created_at 
FROM resources 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any issues with the resources table
SELECT 
  COUNT(*) as total_count,
  COUNT(DISTINCT category) as unique_categories,
  MIN(created_at) as oldest_resource,
  MAX(created_at) as newest_resource
FROM resources;
