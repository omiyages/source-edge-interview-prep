-- Create course assignments table
CREATE TABLE public.course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, stage_id)
);

-- Enable Row Level Security
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for course_assignments
CREATE POLICY "Users can view their assigned courses" 
ON public.course_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage course assignments" 
ON public.course_assignments 
FOR ALL 
USING ((get_current_user_role())::app_role = 'admin'::app_role);

-- Create policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" 
ON public.user_progress 
FOR SELECT 
USING ((get_current_user_role())::app_role = 'admin'::app_role);

-- Add foreign key constraints
ALTER TABLE public.course_assignments 
ADD CONSTRAINT course_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.course_assignments 
ADD CONSTRAINT course_assignments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_assignments 
ADD CONSTRAINT course_assignments_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_stage_id_fkey 
FOREIGN KEY (stage_id) REFERENCES public.course_stages(id) ON DELETE CASCADE;