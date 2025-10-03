// Test script to check if position data is being returned correctly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPositionData() {
  console.log('🔍 Testing position data from database...');
  
  try {
    // Test the RPC function
    const { data, error } = await supabase.rpc('get_users_by_stage_with_rejected', {
      p_stage_name: 'Interested',
      p_show_rejected: false
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }
    
    console.log('📊 RPC Data:', data);
    console.log('👤 Sample user:', data?.[0]);
    
    if (data && data.length > 0) {
      console.log('🔍 Position data for users:');
      data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name}: position="${user.position}", role="${user.role}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testPositionData();
