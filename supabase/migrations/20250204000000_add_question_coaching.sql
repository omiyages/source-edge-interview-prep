-- Add interviewer intent and STAR winning answer framework (server-side generated, cached per question)
-- Regenerate only when question text, role, category, or interview_stage changes; idempotency via prompt hash

ALTER TABLE public.interview_questions
  ADD COLUMN IF NOT EXISTS interviewer_intent jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS winning_answer_framework jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coaching_generated_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coaching_prompt_hash text DEFAULT NULL;

COMMENT ON COLUMN public.interview_questions.interviewer_intent IS 'Array of 3 bullets max: what the interviewer is evaluating';
COMMENT ON COLUMN public.interview_questions.winning_answer_framework IS 'STAR: situation, task, action[], result';
COMMENT ON COLUMN public.interview_questions.coaching_generated_at IS 'When interviewer_intent and winning_answer_framework were last generated';
COMMENT ON COLUMN public.interview_questions.coaching_prompt_hash IS 'Hash of question, role, category, stage for idempotent caching';
