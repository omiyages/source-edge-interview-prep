
-- Add columns to track question source and type
ALTER TABLE public.interview_questions 
ADD COLUMN question_type TEXT CHECK (question_type IN ('user_submitted', 'online_sourced')) DEFAULT 'user_submitted',
ADD COLUMN source_url TEXT,
ADD COLUMN source_website TEXT,
ADD COLUMN scraped_at TIMESTAMP WITH TIME ZONE;

-- Update existing data to mark as user submitted
UPDATE public.interview_questions SET question_type = 'user_submitted';

-- Create index for better performance when filtering by type
CREATE INDEX idx_interview_questions_type ON public.interview_questions(question_type);
CREATE INDEX idx_interview_questions_source ON public.interview_questions(source_website);
