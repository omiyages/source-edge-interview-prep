-- Add database triggers for data consistency and automatic updates

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_stages_updated_at ON public.course_stages;
CREATE TRIGGER update_course_stages_updated_at
    BEFORE UPDATE ON public.course_stages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_questions_updated_at ON public.interview_questions;
CREATE TRIGGER update_interview_questions_updated_at
    BEFORE UPDATE ON public.interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function for auto-approving admin questions (if not exists)
CREATE OR REPLACE FUNCTION public.auto_approve_admin_questions()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add trigger for auto-approving admin questions
DROP TRIGGER IF EXISTS auto_approve_admin_questions_trigger ON public.interview_questions;
CREATE TRIGGER auto_approve_admin_questions_trigger
    BEFORE INSERT ON public.interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_admin_questions();