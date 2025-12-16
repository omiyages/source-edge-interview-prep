-- Create table for question thumbs up/likes
CREATE TABLE IF NOT EXISTS public.question_thumbs_up (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_thumbs_up_question_id ON public.question_thumbs_up(question_id);
CREATE INDEX IF NOT EXISTS idx_question_thumbs_up_user_id ON public.question_thumbs_up(user_id);
CREATE INDEX IF NOT EXISTS idx_question_thumbs_up_created_at ON public.question_thumbs_up(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.question_thumbs_up ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all thumbs up
CREATE POLICY "Anyone can view thumbs up"
  ON public.question_thumbs_up
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can add thumbs up
CREATE POLICY "Authenticated users can add thumbs up"
  ON public.question_thumbs_up
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can remove their own thumbs up
CREATE POLICY "Users can remove their own thumbs up"
  ON public.question_thumbs_up
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to get thumbs up count for a question
CREATE OR REPLACE FUNCTION get_question_thumbs_up_count(question_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.question_thumbs_up
    WHERE question_id = question_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has thumbs up a question
CREATE OR REPLACE FUNCTION has_user_thumbs_up(question_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.question_thumbs_up
    WHERE question_id = question_uuid
      AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.question_thumbs_up TO authenticated;
GRANT SELECT ON public.question_thumbs_up TO anon;



