// Debug script to check position data
// Run this in the browser console on the Kanban board page

console.log('🔍 Debugging position data issue...');

// Check if supabase is available
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase client not found');
} else {
  console.log('✅ Supabase client found');
}

// Test the RPC function directly
async function debugPositionData() {
  try {
    console.log('🔍 Testing get_users_by_stage_with_rejected function...');
    
    const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected', {
      p_stage_name: 'Interested',
      p_show_rejected: false
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }
    
    console.log('📊 Raw RPC Data:', data);
    
    if (data && data.length > 0) {
      console.log('🔍 Position analysis:');
      data.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.full_name}`);
        console.log(`  - position: "${user.position}" (type: ${typeof user.position})`);
        console.log(`  - role: "${user.role}" (type: ${typeof user.role})`);
        console.log(`  - email: "${user.email}"`);
        console.log('  ---');
      });
    } else {
      console.log('⚠️ No users found in Interested stage');
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
}

// Run the debug function
debugPositionData();
