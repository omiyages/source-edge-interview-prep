// Test script to manually add a user to kanban
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddUser() {
  console.log('🧪 Testing manual user addition to kanban...\n');

  try {
    // 1. First, let's create a test user in profiles if none exist
    console.log('1️⃣ Checking if we have any users...');
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    console.log('Existing users:', { data: existingUsers, error: usersError });

    if (!existingUsers || existingUsers.length === 0) {
      console.log('❌ No users found in profiles table. You need to create users first.');
      console.log('💡 Go to your app and create some users, then try again.');
      return;
    }

    const testUser = existingUsers[0];
    console.log(`✅ Using test user: ${testUser.email} (${testUser.id})`);

    // 2. Try to add this user to the kanban board
    console.log('\n2️⃣ Adding user to kanban board...');
    const { error: moveError } = await supabase.rpc('move_user_to_stage', {
      p_user_id: testUser.id,
      p_new_stage: 'Interested',
      p_transitioned_by: testUser.id, // Using same user as admin for test
      p_notes: 'Manual test addition'
    });

    if (moveError) {
      console.error('❌ Error adding user to kanban:', moveError);
    } else {
      console.log('✅ User successfully added to kanban board');
    }

    // 3. Check if the user now appears in the kanban
    console.log('\n3️⃣ Checking if user appears in kanban...');
    const { data: kanbanUsers, error: kanbanError } = await supabase.rpc('get_users_by_stage', {
      p_stage: 'Interested'
    });

    console.log('Kanban users:', { data: kanbanUsers, error: kanbanError });

    if (kanbanUsers && kanbanUsers.length > 0) {
      console.log('🎉 SUCCESS! User is now in the kanban board!');
    } else {
      console.log('❌ User still not appearing in kanban board');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAddUser();
