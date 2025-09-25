// Debug script to check kanban database state
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKanban() {
  console.log('🔍 Debugging kanban database state...\n');

  try {
    // 1. Check if user_stages table exists and has data
    console.log('1️⃣ Checking user_stages table...');
    const { data: userStages, error: stagesError } = await supabase
      .from('user_stages')
      .select('*')
      .limit(5);
    
    console.log('User stages:', { data: userStages, error: stagesError });

    // 2. Check if profiles table has position field
    console.log('\n2️⃣ Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, position')
      .limit(5);
    
    console.log('Profiles:', { data: profiles, error: profilesError });

    // 3. Test the get_users_by_stage function
    console.log('\n3️⃣ Testing get_users_by_stage function...');
    const { data: interestedUsers, error: functionError } = await supabase.rpc('get_users_by_stage', {
      p_stage: 'Interested'
    });
    
    console.log('Interested users:', { data: interestedUsers, error: functionError });

    // 4. Check if move_user_to_stage function works
    console.log('\n4️⃣ Testing move_user_to_stage function...');
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      console.log(`Testing with user: ${testUserId}`);
      
      const { error: moveError } = await supabase.rpc('move_user_to_stage', {
        p_user_id: testUserId,
        p_new_stage: 'Interested',
        p_transitioned_by: testUserId,
        p_notes: 'Debug test'
      });
      
      console.log('Move user result:', { error: moveError });
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugKanban();
