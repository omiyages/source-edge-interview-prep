
-- First, let's enable RLS on tables if not already enabled
ALTER TABLE public.stage_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_stages ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist (using IF NOT EXISTS equivalent approach)
DO $$
BEGIN
    -- Check and create stage_questions policies
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

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'stage_questions' 
        AND policyname = 'Admins can insert stage questions'
    ) THEN
        CREATE POLICY "Admins can insert stage questions" 
        ON public.stage_questions 
        FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'stage_questions' 
        AND policyname = 'Admins can delete stage questions'
    ) THEN
        CREATE POLICY "Admins can delete stage questions" 
        ON public.stage_questions 
        FOR DELETE 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    END IF;

    -- Check and create courses policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'courses' 
        AND policyname = 'Everyone can view courses'
    ) THEN
        CREATE POLICY "Everyone can view courses" 
        ON public.courses 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'courses' 
        AND policyname = 'Admins can manage courses'
    ) THEN
        CREATE POLICY "Admins can manage courses" 
        ON public.courses 
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
    END IF;

    -- Check and create course_stages policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'course_stages' 
        AND policyname = 'Everyone can view course stages'
    ) THEN
        CREATE POLICY "Everyone can view course stages" 
        ON public.course_stages 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'course_stages' 
        AND policyname = 'Admins can manage course stages'
    ) THEN
        CREATE POLICY "Admins can manage course stages" 
        ON public.course_stages 
        FOR ALL 
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
