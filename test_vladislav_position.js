// Test script to verify Vladislav's position is loaded
// Run this in the browser console after running the SQL fix

console.log('🔍 Testing Vladislav position fix...');

async function testVladislavPosition() {
  try {
    console.log('🔍 Testing get_users_by_stage_with_rejected for Vladislav...');
    
    const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected', {
      p_stage_name: 'Interested',
      p_show_rejected: false
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }
    
    console.log('📊 All users data:', data);
    
    // Find Vladislav specifically
    const vladislav = data?.find(user => 
      user.email === 'vladislav@source-edge.com' || 
      user.full_name?.toLowerCase().includes('vladislav')
    );
    
    if (vladislav) {
      console.log('✅ Found Vladislav:');
      console.log(`  - Name: ${vladislav.full_name}`);
      console.log(`  - Email: ${vladislav.email}`);
      console.log(`  - Position: "${vladislav.position}"`);
      console.log(`  - Role: "${vladislav.role}"`);
      
      if (vladislav.position) {
        console.log('🎉 SUCCESS: Position is loaded!');
      } else {
        console.log('❌ FAILED: Position is still null/undefined');
      }
    } else {
      console.log('⚠️ Vladislav not found in the results');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testVladislavPosition();
