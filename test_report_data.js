// Quick test script to verify Report data fetching
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportData() {
  console.log('Testing Report data fetching...\n');

  // Test 1: Fetch user stages
  console.log('1. Fetching user stages...');
  const { data: usersData, error: usersError } = await supabase
    .from('user_stages')
    .select(`
      user_id,
      stage,
      created_at,
      profiles:user_id(
        id,
        email,
        full_name,
        role,
        position,
        company
      )
    `)
    .limit(5);

  if (usersError) {
    console.error('❌ Error fetching user stages:', usersError);
  } else {
    console.log(`✅ Found ${usersData?.length || 0} user stages`);
    console.log('Sample data:', JSON.stringify(usersData?.[0], null, 2));
  }

  // Test 2: Fetch interviews
  console.log('\n2. Fetching interviews...');
  const { data: interviewsData, error: interviewsError } = await supabase
    .from('interviews')
    .select(`
      *,
      profiles:user_id(
        full_name,
        company,
        role
      )
    `)
    .gte('scheduled_date', new Date().toISOString())
    .limit(5);

  if (interviewsError) {
    console.error('❌ Error fetching interviews:', interviewsError);
  } else {
    console.log(`✅ Found ${interviewsData?.length || 0} upcoming interviews`);
    console.log('Sample data:', JSON.stringify(interviewsData?.[0], null, 2));
  }
}

testReportData().catch(console.error);


