
-- Remove check constraints that are preventing new categories and interview stages
-- The application now manages valid options through the dropdown_options table

-- Drop the category check constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'interview_questions_category_check' 
        AND table_name = 'interview_questions'
    ) THEN
        ALTER TABLE interview_questions DROP CONSTRAINT interview_questions_category_check;
    END IF;
END $$;

-- Drop the interview_stage check constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'interview_questions_interview_stage_check' 
        AND table_name = 'interview_questions'
    ) THEN
        ALTER TABLE interview_questions DROP CONSTRAINT interview_questions_interview_stage_check;
    END IF;
END $$;

-- Drop any other similar check constraints that might exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%interview_questions%check%' 
        AND table_name = 'interview_questions'
        AND constraint_type = 'CHECK'
    ) THEN
        -- Get all check constraint names and drop them
        DECLARE
            constraint_rec RECORD;
        BEGIN
            FOR constraint_rec IN 
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE constraint_name LIKE '%interview_questions%check%' 
                AND table_name = 'interview_questions'
                AND constraint_type = 'CHECK'
            LOOP
                EXECUTE 'ALTER TABLE interview_questions DROP CONSTRAINT ' || constraint_rec.constraint_name;
            END LOOP;
        END;
    END IF;
END $$;
