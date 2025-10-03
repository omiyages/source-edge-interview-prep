// Test script to verify position data is being loaded
console.log('🔍 Testing position data loading...');

// This will be run in the browser console to check if position data is available
// Copy and paste this into the browser console on the Kanban board page

// Check if the position field is being returned by the database function
async function testPositionData() {
  try {
    // Test the RPC function directly
    const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected', {
      p_stage_name: 'Interested',
      p_show_rejected: false
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }
    
    console.log('📊 RPC Data:', data);
    
    if (data && data.length > 0) {
      console.log('🔍 Position data for users:');
      data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name}:`);
        console.log(`   - position: "${user.position}"`);
        console.log(`   - role: "${user.role}"`);
        console.log(`   - email: "${user.email}"`);
      });
    } else {
      console.log('⚠️ No users found in Interested stage');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testPositionData();
