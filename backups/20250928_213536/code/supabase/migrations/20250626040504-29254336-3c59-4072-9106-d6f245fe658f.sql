
-- Insert demo questions with approved status
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
),
(
  'What motivates you in your work and how do you stay engaged?',
  'Spotify',
  'Engineering Manager',
  'Easy',
  'Behavioral',
  'Behavioral',
  'sourceedge',
  'Understanding candidate motivation and engagement strategies.',
  'user_submitted',
  'approved'
),
(
  'Explain the concept of database indexing and when you would use different types.',
  'Stripe',
  'Backend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Should cover B-tree, hash, and composite indexes with use cases.',
  'user_submitted',
  'approved'
),
(
  'How would you handle a situation where your team consistently misses deadlines?',
  'Adobe',
  'Engineering Manager',
  'Medium',
  'Behavioral',
  'Behavioral',
  'sourceedge',
  'Focus on project management and team leadership skills.',
  'user_submitted',
  'approved'
),
(
  'Implement a function to detect if a binary tree is balanced.',
  'LinkedIn',
  'Backend Engineer',
  'Medium',
  'Technical',
  'Technical',
  'sourceedge',
  'Should discuss both recursive and iterative approaches with complexity analysis.',
  'user_submitted',
  'approved'
),
(
  'Design a content delivery network (CDN) architecture.',
  'Cloudflare',
  'SRE/DevOps',
  'Hard',
  'Technical',
  'System Design',
  'sourceedge',
  'Cover edge servers, caching strategies, load balancing, and geographic distribution.',
  'user_submitted',
  'approved'
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course stages table
CREATE TABLE public.course_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for stage questions
CREATE TABLE public.stage_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.course_stages(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stage_id, question_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for courses
CREATE POLICY "Anyone can view courses"
  ON public.courses
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON public.courses
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for course_stages
CREATE POLICY "Anyone can view course stages"
  ON public.course_stages
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage course stages"
  ON public.course_stages
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for stage_questions
CREATE POLICY "Anyone can view stage questions"
  ON public.stage_questions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stage questions"
  ON public.stage_questions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
