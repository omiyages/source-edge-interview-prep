
-- Add database indexes for frequently queried columns to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_interview_questions_status ON interview_questions(status);
CREATE INDEX IF NOT EXISTS idx_interview_questions_company_role ON interview_questions(company, role);
CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON course_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_candidate_id ON candidate_pipeline(candidate_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);

-- Improve RLS policy for profiles to be more specific about admin access
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update profiles" ON profiles  
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add constraint to ensure email uniqueness in profiles table
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add check constraint for role validation (security enhancement)
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'user'));

-- Improve security for candidates table by adding email uniqueness where not null
CREATE UNIQUE INDEX IF NOT EXISTS candidates_email_unique 
  ON candidates(email) WHERE email IS NOT NULL;

-- Add updated_at trigger for profiles table if not exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add better indexing for auth-related queries
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_course_assignments_assigned_by ON course_assignments(assigned_by);
