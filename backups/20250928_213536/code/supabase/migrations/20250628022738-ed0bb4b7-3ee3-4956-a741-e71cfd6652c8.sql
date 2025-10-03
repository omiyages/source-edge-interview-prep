
-- First, let's see what values are currently being used and fix the check constraint
-- Remove the existing restrictive check constraints that are causing issues
ALTER TABLE public.interview_questions DROP CONSTRAINT IF EXISTS interview_questions_interview_stage_check;
ALTER TABLE public.interview_questions DROP CONSTRAINT IF EXISTS interview_questions_category_check;
ALTER TABLE public.interview_questions DROP CONSTRAINT IF EXISTS interview_questions_difficulty_check;

-- Add more flexible check constraints that allow the values being used in the application
ALTER TABLE public.interview_questions ADD CONSTRAINT interview_questions_difficulty_check 
  CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced'));

ALTER TABLE public.interview_questions ADD CONSTRAINT interview_questions_category_check 
  CHECK (category IN ('Technical', 'Behavioral', 'System Design', 'Problem Solving', 'Culture Fit', 'Other', 'Coding', 'Data Structures', 'Algorithms'));

ALTER TABLE public.interview_questions ADD CONSTRAINT interview_questions_interview_stage_check 
  CHECK (interview_stage IN ('Phone Screen', 'Technical', 'Behavioral', 'System Design', 'Final Round', 'Other', 'HR Screen', 'Technical Assessment', 'Cross Interview', 'Final Interview', 'Onsite', 'Panel', 'Peer Interview'));

-- Update any existing rows that might have values not matching the new constraints
UPDATE public.interview_questions 
SET interview_stage = 'Technical' 
WHERE interview_stage NOT IN ('Phone Screen', 'Technical', 'Behavioral', 'System Design', 'Final Round', 'Other', 'HR Screen', 'Technical Assessment', 'Cross Interview', 'Final Interview', 'Onsite', 'Panel', 'Peer Interview');

UPDATE public.interview_questions 
SET category = 'Technical' 
WHERE category NOT IN ('Technical', 'Behavioral', 'System Design', 'Problem Solving', 'Culture Fit', 'Other', 'Coding', 'Data Structures', 'Algorithms');

UPDATE public.interview_questions 
SET difficulty = 'Medium' 
WHERE difficulty NOT IN ('Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced');
