-- Update the category check constraint to include 'Background' instead of 'Problem Solving'
-- and remove some unused categories to match the form options
ALTER TABLE public.interview_questions 
DROP CONSTRAINT interview_questions_category_check;

ALTER TABLE public.interview_questions 
ADD CONSTRAINT interview_questions_category_check 
CHECK (category = ANY (ARRAY['Technical'::text, 'Behavioral'::text, 'System Design'::text, 'Background'::text, 'Culture Fit'::text, 'Other'::text]));