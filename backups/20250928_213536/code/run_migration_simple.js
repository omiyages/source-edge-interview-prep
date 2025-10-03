// Simple migration guide

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

async function runMigration() {
  console.log('🚀 Starting database migration...');
  console.log('⚠️  Note: You need to run this SQL manually in your Supabase dashboard:');
  console.log('');
  console.log('📋 Copy and paste this SQL into your Supabase SQL Editor:');
  console.log('');
  console.log('-- Add position field to profiles table for job titles/roles');
  console.log('ALTER TABLE public.profiles');
  console.log('ADD COLUMN IF NOT EXISTS position TEXT;');
  console.log('');
  console.log('-- Create index for position field for better performance');
  console.log('CREATE INDEX IF NOT EXISTS idx_profiles_position ON public.profiles(position);');
  console.log('');
  console.log('-- Update the comment to clarify the difference between role and position');
  console.log("COMMENT ON COLUMN public.profiles.role IS 'Authentication role: user or admin';");
  console.log("COMMENT ON COLUMN public.profiles.position IS 'Job position/title: Software Engineer, Product Manager, etc.';");
  console.log('');
  console.log('-- Update the get_users_by_stage function to use position field');
  console.log('CREATE OR REPLACE FUNCTION get_users_by_stage(p_stage VARCHAR(50))');
  console.log('RETURNS TABLE (');
  console.log('  user_id UUID,');
  console.log('  email TEXT,');
  console.log('  full_name TEXT,');
  console.log('  role TEXT,');
  console.log('  last_activity_at TIMESTAMP WITH TIME ZONE,');
  console.log('  total_session_time_minutes INTEGER,');
  console.log('  stage_updated_at TIMESTAMP WITH TIME ZONE');
  console.log(') AS $$');
  console.log('BEGIN');
  console.log('  RETURN QUERY');
  console.log('  SELECT');
  console.log('    p.id,');
  console.log('    p.email,');
  console.log('    p.full_name,');
  console.log('    COALESCE(p.position, p.role) as role, -- Use position if available, fallback to role');
  console.log('    p.last_activity_at,');
  console.log('    p.total_session_time_minutes,');
  console.log('    us.updated_at as stage_updated_at');
  console.log('  FROM profiles p');
  console.log('  JOIN user_stages us ON p.id = us.user_id');
  console.log('  LEFT JOIN user_rejections ur ON p.id = ur.user_id');
  console.log('  WHERE us.stage = p_stage');
  console.log('    AND us.is_active = true');
  console.log('    AND ur.user_id IS NULL');
  console.log('  ORDER BY us.updated_at DESC;');
  console.log('END;');
  console.log('$$ LANGUAGE plpgsql;');
  console.log('');
  console.log('🎯 Steps to complete:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Paste the SQL above');
  console.log('5. Click "Run"');
  console.log('6. Refresh your app and test!');
}

runMigration();
