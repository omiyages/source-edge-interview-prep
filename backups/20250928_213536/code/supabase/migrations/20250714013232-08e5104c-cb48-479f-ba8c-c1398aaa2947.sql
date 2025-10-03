-- Add missing indexes for better query performance

-- Add indexes for course_stages table
CREATE INDEX IF NOT EXISTS idx_course_stages_course_id ON public.course_stages(course_id);
CREATE INDEX IF NOT EXISTS idx_course_stages_stage_order ON public.course_stages(stage_order);

-- Add indexes for course_assignments table  
CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON public.course_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON public.course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_assigned_by ON public.course_assignments(assigned_by);

-- Add indexes for user_progress table
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON public.user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_stage_id ON public.user_progress(stage_id);

-- Add indexes for resources table
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON public.resources(created_by);

-- Add indexes for stage_questions table
CREATE INDEX IF NOT EXISTS idx_stage_questions_stage_id ON public.stage_questions(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_questions_question_id ON public.stage_questions(question_id);

-- Add index for hiring_stages ordering
CREATE INDEX IF NOT EXISTS idx_hiring_stages_stage_order ON public.hiring_stages(stage_order);

-- Add composite index for interview_questions filtering
CREATE INDEX IF NOT EXISTS idx_interview_questions_company_role ON public.interview_questions(company, role);
CREATE INDEX IF NOT EXISTS idx_interview_questions_category_status ON public.interview_questions(category, status);

-- Add index for profiles email lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);