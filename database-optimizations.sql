-- Database Performance Optimizations
-- Run these SQL commands in your Supabase SQL editor

-- 1. Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_interview_questions_status_created 
ON interview_questions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_questions_company_role 
ON interview_questions(company, role);

CREATE INDEX IF NOT EXISTS idx_interview_questions_category_stage 
ON interview_questions(category, interview_stage);

CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id 
ON course_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id 
ON course_assignments(course_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course 
ON user_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_stage_id 
ON user_progress(stage_id);

CREATE INDEX IF NOT EXISTS idx_stage_questions_stage_id 
ON stage_questions(stage_id);

CREATE INDEX IF NOT EXISTS idx_stage_questions_question_id 
ON stage_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_stage_resources_stage_id 
ON stage_resources(stage_id);

CREATE INDEX IF NOT EXISTS idx_stage_resources_resource_id 
ON stage_resources(resource_id);

CREATE INDEX IF NOT EXISTS idx_course_stages_course_id_order 
ON course_stages(course_id, stage_order);

CREATE INDEX IF NOT EXISTS idx_resources_category_created 
ON resources(category, created_at DESC);

-- 2. Add composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_interview_questions_admin_filter 
ON interview_questions(status, created_at DESC, company, role);

CREATE INDEX IF NOT EXISTS idx_user_progress_complete 
ON user_progress(user_id, course_id, stage_id);

-- 3. Add partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_questions_pending 
ON interview_questions(created_at DESC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_interview_questions_approved 
ON interview_questions(created_at DESC) 
WHERE status = 'approved';

-- 4. Add indexes for text search (if using full-text search)
CREATE INDEX IF NOT EXISTS idx_interview_questions_question_text 
ON interview_questions USING gin(to_tsvector('english', question));

CREATE INDEX IF NOT EXISTS idx_resources_title_text 
ON resources USING gin(to_tsvector('english', title));

-- 5. Optimize user profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

-- 6. Add indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_courses_created_at 
ON courses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courses_company 
ON courses(company);

-- 7. Performance monitoring function
CREATE OR REPLACE FUNCTION get_query_performance()
RETURNS TABLE (
  query_text text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  rows bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 8. Add materialized view for frequently accessed data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_course_progress_summary AS
SELECT 
  c.id as course_id,
  c.title as course_title,
  c.company,
  COUNT(ca.user_id) as total_assignments,
  COUNT(up.stage_id) as total_completions,
  ROUND(
    (COUNT(up.stage_id)::decimal / NULLIF(COUNT(cs.id), 0)) * 100, 
    2
  ) as completion_rate
FROM courses c
LEFT JOIN course_assignments ca ON c.id = ca.course_id
LEFT JOIN course_stages cs ON c.id = cs.course_id
LEFT JOIN user_progress up ON cs.id = up.stage_id
GROUP BY c.id, c.title, c.company;

-- Refresh the materialized view periodically
CREATE OR REPLACE FUNCTION refresh_course_progress_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_course_progress_summary;
END;
$$ LANGUAGE plpgsql;

-- 9. Add function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old security logs (older than 90 days)
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old session data (older than 30 days)
  DELETE FROM user_sessions 
  WHERE last_activity < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 10. Add database statistics collection
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
  ANALYZE interview_questions;
  ANALYZE resources;
  ANALYZE courses;
  ANALYZE course_assignments;
  ANALYZE user_progress;
  ANALYZE course_stages;
  ANALYZE stage_questions;
  ANALYZE stage_resources;
END;
$$ LANGUAGE plpgsql;

-- 11. Create a function to monitor slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query_text text,
  mean_time double precision,
  calls bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    mean_time,
    calls
  FROM pg_stat_statements 
  WHERE mean_time > 1000 -- Queries taking more than 1 second
  ORDER BY mean_time DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. Add RLS policies optimization
-- Ensure RLS policies are efficient and don't cause full table scans
-- Review existing policies and add indexes to support them

-- Example: If you have a policy like "WHERE user_id = auth.uid()"
-- Make sure there's an index on user_id columns

-- 13. Add connection pooling configuration
-- This should be done in Supabase dashboard under Database > Settings
-- Set max_connections to appropriate value based on your usage

-- 14. Enable query plan caching
-- This is usually enabled by default in Supabase, but you can verify
-- by checking the shared_preload_libraries setting
