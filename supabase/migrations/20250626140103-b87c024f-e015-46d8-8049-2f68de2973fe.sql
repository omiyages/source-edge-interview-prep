
-- Delete all demo questions
DELETE FROM public.interview_questions WHERE question_type = 'user_submitted' AND submitted_by = 'sourceedge';

-- Update any existing "Problem Solving" categories to "Background"
UPDATE public.interview_questions SET category = 'Background' WHERE category = 'Problem Solving';

-- Add new columns to interview_questions table
ALTER TABLE public.interview_questions 
ADD COLUMN team TEXT,
ADD COLUMN position_name TEXT;
