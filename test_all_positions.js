// Test script to verify ALL users' positions are loaded correctly
// Run this in the browser console after running the SQL fix

console.log('🔍 Testing ALL users position fix...');

async function testAllPositions() {
  try {
    console.log('🔍 Testing get_users_by_stage_with_rejected for all users...');
    
    const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected', {
      p_stage_name: 'Interested',
      p_show_rejected: false
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }
    
    console.log('📊 All users data:', data);
    
    if (data && data.length > 0) {
      console.log('🔍 Position analysis for all users:');
      let successCount = 0;
      let failCount = 0;
      
      data.forEach((user, index) => {
        const hasPosition = user.position && user.position.trim() !== '';
        const status = hasPosition ? '✅' : '❌';
        
        console.log(`${status} User ${index + 1}: ${user.full_name}`);
        console.log(`    - Email: ${user.email}`);
        console.log(`    - Position: "${user.position}"`);
        console.log(`    - Role: "${user.role}"`);
        console.log('    ---');
        
        if (hasPosition) {
          successCount++;
        } else {
          failCount++;
        }
      });
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`✅ Users with positions: ${successCount}`);
      console.log(`❌ Users without positions: ${failCount}`);
      console.log(`📈 Success rate: ${Math.round((successCount / data.length) * 100)}%`);
      
      if (successCount === data.length) {
        console.log('🎉 SUCCESS: All users have positions loaded!');
      } else {
        console.log('⚠️ Some users still missing positions');
      }
    } else {
      console.log('⚠️ No users found in Interested stage');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testAllPositions();
