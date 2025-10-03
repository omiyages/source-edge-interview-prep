// Test script to check resources loading
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testResourcesLoading() {
  try {
    console.log('🔍 Testing resources loading...');
    
    // Test 1: Count total resources
    const { count, error: countError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting resources:', countError);
      return;
    }
    
    console.log('✅ Total resources in database:', count);
    
    // Test 2: Fetch all resources
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching resources:', error);
      return;
    }
    
    console.log('✅ Resources fetched successfully:', data?.length || 0);
    console.log('📊 Sample resources:', data?.slice(0, 3).map(r => ({ id: r.id, title: r.title, category: r.category })));
    
    // Test 3: Check categories
    const categories = [...new Set(data?.map(r => r.category) || [])];
    console.log('📂 Available categories:', categories);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testResourcesLoading();
