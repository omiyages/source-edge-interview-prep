-- Fix user profile references and add proper constraints

-- Add proper foreign key constraints for user references
DO $$
BEGIN
    -- Fix profiles.created_by -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_created_by_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Fix resources.created_by -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'resources_created_by_fkey' 
        AND table_name = 'resources'
    ) THEN
        ALTER TABLE public.resources 
        ADD CONSTRAINT resources_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Fix courses.created_by -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_created_by_fkey' 
        AND table_name = 'courses'
    ) THEN
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Fix interview_questions.approved_by -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'interview_questions_approved_by_fkey' 
        AND table_name = 'interview_questions'
    ) THEN
        ALTER TABLE public.interview_questions 
        ADD CONSTRAINT interview_questions_approved_by_fkey 
        FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Fix course_assignments.user_id -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_assignments_user_id_fkey' 
        AND table_name = 'course_assignments'
    ) THEN
        ALTER TABLE public.course_assignments 
        ADD CONSTRAINT course_assignments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Fix course_assignments.assigned_by -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_assignments_assigned_by_fkey' 
        AND table_name = 'course_assignments'
    ) THEN
        ALTER TABLE public.course_assignments 
        ADD CONSTRAINT course_assignments_assigned_by_fkey 
        FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Fix user_progress.user_id -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_progress_user_id_fkey' 
        AND table_name = 'user_progress'
    ) THEN
        ALTER TABLE public.user_progress 
        ADD CONSTRAINT user_progress_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Fix user_sessions.user_id -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_sessions_user_id_fkey' 
        AND table_name = 'user_sessions'
    ) THEN
        ALTER TABLE public.user_sessions 
        ADD CONSTRAINT user_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Fix candidate_pipeline.candidate_id -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidate_pipeline_candidate_id_fkey' 
        AND table_name = 'candidate_pipeline'
    ) THEN
        ALTER TABLE public.candidate_pipeline 
        ADD CONSTRAINT candidate_pipeline_candidate_id_fkey 
        FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Fix candidate_pipeline.moved_by -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidate_pipeline_moved_by_fkey' 
        AND table_name = 'candidate_pipeline'
    ) THEN
        ALTER TABLE public.candidate_pipeline 
        ADD CONSTRAINT candidate_pipeline_moved_by_fkey 
        FOREIGN KEY (moved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Fix question_likes.user_id -> profiles.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'question_likes_user_id_fkey' 
        AND table_name = 'question_likes'
    ) THEN
        ALTER TABLE public.question_likes 
        ADD CONSTRAINT question_likes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;