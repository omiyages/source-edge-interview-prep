
-- Add missing foreign key constraints for course_reviews table

-- Add foreign key for course_reviews.user_id -> profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_reviews_user_id_fkey' 
        AND table_name = 'course_reviews'
    ) THEN
        ALTER TABLE public.course_reviews 
        ADD CONSTRAINT course_reviews_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for course_reviews.course_id -> courses.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_reviews_course_id_fkey' 
        AND table_name = 'course_reviews'
    ) THEN
        ALTER TABLE public.course_reviews 
        ADD CONSTRAINT course_reviews_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;
