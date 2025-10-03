// Test script to verify positions are being saved correctly
// Run this in the browser console

console.log('🔍 Testing position saving...');

async function testPositionSaving() {
  try {
    // Check if positions are being saved in profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, position')
      .not('position', 'is', null)
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error loading profiles:', profilesError);
      return;
    }
    
    console.log('📊 Profiles with positions:', profiles);
    
    // Check if the RPC function returns position data
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_by_stage_with_rejected', {
      p_stage_name: 'Interested',
      p_show_rejected: false
    });
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
      return;
    }
    
    console.log('📊 RPC function results:', rpcData);
    
    if (rpcData && rpcData.length > 0) {
      console.log('🔍 Position analysis:');
      rpcData.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.full_name}`);
        console.log(`  - Position: "${user.position}"`);
        console.log(`  - Role: "${user.role}"`);
        console.log(`  - Email: "${user.email}"`);
        console.log('  ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testPositionSaving();
