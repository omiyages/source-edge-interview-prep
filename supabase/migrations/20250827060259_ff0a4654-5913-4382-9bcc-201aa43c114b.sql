
-- Add the recommended column to the interview_questions table
ALTER TABLE public.interview_questions 
ADD COLUMN recommended boolean DEFAULT false;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.interview_questions.recommended IS 'Indicates if this question is marked as recommended by admins or contributors';
