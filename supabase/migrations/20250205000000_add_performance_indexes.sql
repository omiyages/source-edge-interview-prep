-- Performance optimization indexes
-- These indexes improve query performance for common access patterns

-- Index for faster user progress lookups (used in dashboard and course views)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course 
ON user_progress(user_id, course_id);

-- Index for faster question likes/bookmarks lookups
CREATE INDEX IF NOT EXISTS idx_question_likes_user 
ON question_likes(user_id);

-- Index for question likes by question (for counting likes)
CREATE INDEX IF NOT EXISTS idx_question_likes_question 
ON question_likes(question_id);

-- Index for faster course stage lookups
CREATE INDEX IF NOT EXISTS idx_course_stages_course 
ON course_stages(course_id, stage_order);

-- Index for faster stage questions lookups
CREATE INDEX IF NOT EXISTS idx_stage_questions_stage 
ON stage_questions(stage_id);

-- Index for faster course assignments lookups
CREATE INDEX IF NOT EXISTS idx_course_assignments_user 
ON course_assignments(user_id);

-- Index for interview questions by company (common filter)
CREATE INDEX IF NOT EXISTS idx_interview_questions_company 
ON interview_questions(company);

-- Index for interview questions by status (for admin filtering)
CREATE INDEX IF NOT EXISTS idx_interview_questions_status 
ON interview_questions(status);

-- Index for thumbs up lookups
CREATE INDEX IF NOT EXISTS idx_question_thumbs_up_question 
ON question_thumbs_up(question_id);

CREATE INDEX IF NOT EXISTS idx_question_thumbs_up_user 
ON question_thumbs_up(user_id);

-- Composite index for dropdown options (common lookup pattern)
CREATE INDEX IF NOT EXISTS idx_dropdown_options_field_value 
ON dropdown_options(field_name, value);
