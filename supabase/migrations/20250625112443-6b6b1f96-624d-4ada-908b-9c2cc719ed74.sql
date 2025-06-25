-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add approval status to interview_questions
ALTER TABLE public.interview_questions 
ADD COLUMN status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Create likes table for thumbs up functionality
CREATE TABLE public.question_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Enable RLS on question_likes
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for question_likes
CREATE POLICY "Users can manage their own likes"
  ON public.question_likes
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes"
  ON public.question_likes
  FOR SELECT
  USING (true);

-- Update interview_questions RLS policies
DROP POLICY IF EXISTS "Anyone can view interview questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Anyone can submit interview questions" ON public.interview_questions;

-- New policies for interview_questions
CREATE POLICY "Users can view approved questions"
  ON public.interview_questions
  FOR SELECT
  USING (
    status = 'approved' OR 
    public.has_role(auth.uid(), 'admin') OR
    (auth.uid() = (
      SELECT profiles.id FROM profiles 
      WHERE profiles.email = submitted_by
    ))
  );

CREATE POLICY "Authenticated users can submit questions"
  ON public.interview_questions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update all questions"
  ON public.interview_questions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-approve questions submitted by admins
CREATE OR REPLACE FUNCTION public.auto_approve_admin_questions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check if the submitter is an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = NEW.submitted_by 
    AND role = 'admin'
  ) THEN
    NEW.status = 'approved';
    NEW.approved_at = now();
    NEW.approved_by = (
      SELECT id FROM public.profiles 
      WHERE email = NEW.submitted_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-approval
CREATE TRIGGER auto_approve_admin_questions_trigger
  BEFORE INSERT ON public.interview_questions
  FOR EACH ROW EXECUTE PROCEDURE public.auto_approve_admin_questions();

-- Create indexes for better performance
CREATE INDEX idx_interview_questions_status ON public.interview_questions(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_question_likes_question_id ON public.question_likes(question_id);

-- Add some demo questions with approved status
INSERT INTO public.interview_questions (
  question,
  company,
  role,
  difficulty,
  interview_stage,
  category,
  submitted_by,
  additional_context,
  question_type,
  status
) VALUES
(
  'Implement a function to reverse a linked list iteratively and recursively.',
  'Google',
  'Backend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Expected to implement both approaches and discuss time/space complexity.',
  'user_submitted',
  'approved'
),
(
  'Tell me about a time when you had to work with a difficult team member and how you handled it.',
  'Microsoft',
  'Engineering Manager',
  'Medium',
  'Behavioral',
  'Behavioral',
  'sourceedge',
  'Standard behavioral question focusing on conflict resolution and teamwork.',
  'user_submitted',
  'approved'
),
(
  'Design a URL shortening service like bit.ly. Consider scalability and performance.',
  'Amazon',
  'Backend Engineer',
  'Hard',
  'Technical',
  'System Design',
  'sourceedge',
  'Need to discuss database design, caching strategies, and handling millions of requests.',
  'user_submitted',
  'approved'
),
(
  'How would you optimize a React application that is rendering slowly?',
  'Meta',
  'Frontend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Should cover React.memo, useMemo, useCallback, and virtual scrolling.',
  'user_submitted',
  'approved'
),
(
  'Implement a LRU (Least Recently Used) cache with O(1) operations.',
  'Netflix',
  'Backend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Expected to use HashMap + Doubly Linked List approach.',
  'user_submitted',
  'approved'
),
(
  'Describe a challenging project you worked on and how you overcame obstacles.',
  'Apple',
  'Engineering Manager',
  'Easy',
  'Behavioral',
  'Behavioral',
  'sourceedge',
  'Looking for leadership skills and problem-solving approach.',
  'user_submitted',
  'approved'
),
(
  'Design a real-time chat application architecture.',
  'Slack',
  'Backend Engineer',
  'Hard',
  'Technical',
  'System Design',
  'sourceedge',
  'Should cover WebSockets, message queues, database design, and scaling.',
  'user_submitted',
  'approved'
),
(
  'How do you handle state management in large React applications?',
  'Airbnb',
  'Frontend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Discuss Redux, Context API, Zustand, and when to use each.',
  'user_submitted',
  'approved'
),
(
  'Write a function to find the longest palindromic substring.',
  'Uber',
  'Backend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Should discuss multiple approaches including expand around centers.',
  'user_submitted',
  'approved'
),
(
  'How would you implement monitoring and alerting for a microservices architecture?',
  'Twitter',
  'SRE/DevOps',
  'Hard',
  'Technical',
  'System Design',
  'sourceedge',
  'Cover distributed tracing, metrics collection, log aggregation, and alerting strategies.',
  'user_submitted',
  'approved'
);
