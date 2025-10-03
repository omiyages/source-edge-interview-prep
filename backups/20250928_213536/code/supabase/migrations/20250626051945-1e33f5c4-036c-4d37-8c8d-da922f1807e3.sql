
-- Add RLS policies for interview_questions table
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_questions table
DO $$
BEGIN
    -- Allow everyone to view approved questions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'interview_questions' 
        AND policyname = 'Everyone can view approved questions'
    ) THEN
        CREATE POLICY "Everyone can view approved questions" 
        ON public.interview_questions 
        FOR SELECT 
        USING (status = 'approved' OR status IS NULL);
    END IF;

    -- Allow authenticated users to insert questions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'interview_questions' 
        AND policyname = 'Authenticated users can submit questions'
    ) THEN
        CREATE POLICY "Authenticated users can submit questions" 
        ON public.interview_questions 
        FOR INSERT 
        TO authenticated
        WITH CHECK (true);
    END IF;

    -- Allow admins to manage all questions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'interview_questions' 
        AND policyname = 'Admins can manage all questions'
    ) THEN
        CREATE POLICY "Admins can manage all questions" 
        ON public.interview_questions 
        FOR ALL 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    END IF;
END
$$;

-- Add RLS policies for stage_questions table
ALTER TABLE public.stage_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for stage_questions table
DO $$
BEGIN
    -- Allow admins to manage stage questions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'stage_questions' 
        AND policyname = 'Admins can manage stage questions'
    ) THEN
        CREATE POLICY "Admins can manage stage questions" 
        ON public.stage_questions 
        FOR ALL 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    END IF;

    -- Allow everyone to view stage questions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'stage_questions' 
        AND policyname = 'Everyone can view stage questions'
    ) THEN
        CREATE POLICY "Everyone can view stage questions" 
        ON public.stage_questions 
        FOR SELECT 
        USING (true);
    END IF;
END
$$;
