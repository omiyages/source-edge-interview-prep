-- Add missing course and stage relationships

DO $$
BEGIN
    -- Fix course_assignments.course_id -> courses.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_assignments_course_id_fkey' 
        AND table_name = 'course_assignments'
    ) THEN
        ALTER TABLE public.course_assignments 
        ADD CONSTRAINT course_assignments_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;

    -- Fix user_progress.course_id -> courses.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_progress_course_id_fkey' 
        AND table_name = 'user_progress'
    ) THEN
        ALTER TABLE public.user_progress 
        ADD CONSTRAINT user_progress_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;

    -- Fix user_progress.stage_id -> course_stages.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_progress_stage_id_fkey' 
        AND table_name = 'user_progress'
    ) THEN
        ALTER TABLE public.user_progress 
        ADD CONSTRAINT user_progress_stage_id_fkey 
        FOREIGN KEY (stage_id) REFERENCES public.course_stages(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add check constraints for data validation
DO $$
BEGIN
    -- Add check constraint for interview_questions status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'interview_questions_status_check'
    ) THEN
        ALTER TABLE public.interview_questions 
        ADD CONSTRAINT interview_questions_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- Add check constraint for interview_questions category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'interview_questions_category_check'
    ) THEN
        ALTER TABLE public.interview_questions 
        ADD CONSTRAINT interview_questions_category_check 
        CHECK (category IN ('Technical', 'Behavioral', 'System Design', 'Background', 'Culture Fit', 'Other'));
    END IF;

    -- Add check constraint for profiles role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin'));
    END IF;

    -- Add check constraint for hiring_stages stage_order
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'hiring_stages_stage_order_check'
    ) THEN
        ALTER TABLE public.hiring_stages 
        ADD CONSTRAINT hiring_stages_stage_order_check 
        CHECK (stage_order > 0);
    END IF;

    -- Add check constraint for course_stages stage_order
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'course_stages_stage_order_check'
    ) THEN
        ALTER TABLE public.course_stages 
        ADD CONSTRAINT course_stages_stage_order_check 
        CHECK (stage_order > 0);
    END IF;
END $$;