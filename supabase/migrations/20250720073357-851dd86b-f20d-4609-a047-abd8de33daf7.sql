
-- Remove the overall_rating column from course_reviews table since we're using aggregate ratings
ALTER TABLE public.course_reviews DROP COLUMN IF EXISTS overall_rating;
