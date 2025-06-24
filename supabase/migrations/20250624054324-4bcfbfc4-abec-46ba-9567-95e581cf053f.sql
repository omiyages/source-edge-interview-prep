
-- Create table for interview questions
CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
  interview_stage TEXT CHECK (interview_stage IN ('Phone Screen', 'Technical', 'Behavioral', 'System Design', 'Final Round', 'Other')) DEFAULT 'Technical',
  category TEXT CHECK (category IN ('Technical', 'Behavioral', 'System Design', 'Problem Solving', 'Culture Fit', 'Other')) DEFAULT 'Technical',
  submitted_by TEXT,
  additional_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add some sample data
INSERT INTO public.interview_questions (question, company, role, difficulty, interview_stage, category, submitted_by, additional_context) VALUES
('Implement a function to reverse a linked list', 'Google', 'Software Engineer', 'Medium', 'Technical', 'Technical', 'Anonymous', 'Asked during phone screen, expected O(n) time complexity'),
('Tell me about a time when you had to work with a difficult team member', 'Microsoft', 'Product Manager', 'Easy', 'Behavioral', 'Behavioral', 'Anonymous', 'Standard behavioral question, lasted about 10 minutes'),
('Design a URL shortening service like bit.ly', 'Amazon', 'Senior Software Engineer', 'Hard', 'System Design', 'System Design', 'Anonymous', 'Asked to design for scale, discuss trade-offs'),
('How would you handle a situation where a project deadline is at risk?', 'Meta', 'Engineering Manager', 'Medium', 'Behavioral', 'Behavioral', 'Anonymous', 'Follow-up questions about stakeholder communication'),
('Implement a LRU Cache', 'Netflix', 'Software Engineer', 'Medium', 'Technical', 'Technical', 'Anonymous', 'Expected to implement in 30 minutes with optimal time complexity');

-- Enable Row Level Security (making it public for now since this is a community directory)
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read questions
CREATE POLICY "Anyone can view interview questions" 
  ON public.interview_questions 
  FOR SELECT 
  USING (true);

-- Create policy to allow everyone to insert questions (for community submissions)
CREATE POLICY "Anyone can submit interview questions" 
  ON public.interview_questions 
  FOR INSERT 
  WITH CHECK (true);
