-- Fix missing foreign key constraints and add proper referential integrity

-- Add missing foreign key constraints
DO $$
BEGIN
    -- Add foreign key for course_stages.course_id -> courses.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_stages_course_id_fkey' 
        AND table_name = 'course_stages'
    ) THEN
        ALTER TABLE public.course_stages 
        ADD CONSTRAINT course_stages_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for stage_questions.stage_id -> course_stages.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stage_questions_stage_id_fkey' 
        AND table_name = 'stage_questions'
    ) THEN
        ALTER TABLE public.stage_questions 
        ADD CONSTRAINT stage_questions_stage_id_fkey 
        FOREIGN KEY (stage_id) REFERENCES public.course_stages(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for stage_questions.question_id -> interview_questions.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stage_questions_question_id_fkey' 
        AND table_name = 'stage_questions'
    ) THEN
        ALTER TABLE public.stage_questions 
        ADD CONSTRAINT stage_questions_question_id_fkey 
        FOREIGN KEY (question_id) REFERENCES public.interview_questions(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for stage_resources.stage_id -> course_stages.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stage_resources_stage_id_fkey' 
        AND table_name = 'stage_resources'
    ) THEN
        ALTER TABLE public.stage_resources 
        ADD CONSTRAINT stage_resources_stage_id_fkey 
        FOREIGN KEY (stage_id) REFERENCES public.course_stages(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for stage_resources.resource_id -> resources.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stage_resources_resource_id_fkey' 
        AND table_name = 'stage_resources'
    ) THEN
        ALTER TABLE public.stage_resources 
        ADD CONSTRAINT stage_resources_resource_id_fkey 
        FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for candidate_pipeline.stage_id -> hiring_stages.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidate_pipeline_stage_id_fkey' 
        AND table_name = 'candidate_pipeline'
    ) THEN
        ALTER TABLE public.candidate_pipeline 
        ADD CONSTRAINT candidate_pipeline_stage_id_fkey 
        FOREIGN KEY (stage_id) REFERENCES public.hiring_stages(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for question_likes.question_id -> interview_questions.id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'question_likes_question_id_fkey' 
        AND table_name = 'question_likes'
    ) THEN
        ALTER TABLE public.question_likes 
        ADD CONSTRAINT question_likes_question_id_fkey 
        FOREIGN KEY (question_id) REFERENCES public.interview_questions(id) ON DELETE CASCADE;
    END IF;
END $$;