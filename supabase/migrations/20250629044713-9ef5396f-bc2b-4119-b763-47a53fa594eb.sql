
-- Fix the interview_stage check constraint to include "Technical Interview" which is used in the form
ALTER TABLE public.interview_questions DROP CONSTRAINT IF EXISTS interview_questions_interview_stage_check;

ALTER TABLE public.interview_questions ADD CONSTRAINT interview_questions_interview_stage_check 
  CHECK (interview_stage IN ('HR Screen', 'Technical Interview', 'Cross-Functional', 'Final Interview', 'Phone Screen', 'Technical', 'Behavioral', 'System Design', 'Final Round', 'Other', 'Technical Assessment', 'Cross Interview', 'Onsite', 'Panel', 'Peer Interview'));

-- Also remove the difficulty column since it's not being used consistently
ALTER TABLE public.interview_questions DROP COLUMN IF EXISTS difficulty;
