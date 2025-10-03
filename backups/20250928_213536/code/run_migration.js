import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Add position column
    console.log('📝 Adding position column to profiles table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;'
    });
    
    if (alterError) {
      console.error('❌ Error adding position column:', alterError);
    } else {
      console.log('✅ Position column added successfully');
    }

    // Create index
    console.log('📝 Creating index for position field...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_position ON public.profiles(position);'
    });
    
    if (indexError) {
      console.error('❌ Error creating index:', indexError);
    } else {
      console.log('✅ Index created successfully');
    }

    // Update function
    console.log('📝 Updating get_users_by_stage function...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION get_users_by_stage(p_stage VARCHAR(50))
      RETURNS TABLE (
        user_id UUID,
        email TEXT,
        full_name TEXT,
        role TEXT,
        last_activity_at TIMESTAMP WITH TIME ZONE,
        total_session_time_minutes INTEGER,
        stage_updated_at TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          p.id,
          p.email,
          p.full_name,
          COALESCE(p.position, p.role) as role,
          p.last_activity_at,
          p.total_session_time_minutes,
          us.updated_at as stage_updated_at
        FROM profiles p
        JOIN user_stages us ON p.id = us.user_id
        LEFT JOIN user_rejections ur ON p.id = ur.user_id
        WHERE us.stage = p_stage 
          AND us.is_active = true
          AND ur.user_id IS NULL
        ORDER BY us.updated_at DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: functionSQL
    });
    
    if (functionError) {
      console.error('❌ Error updating function:', functionError);
    } else {
      console.log('✅ Function updated successfully');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
