// Test script to check Resources page functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testResourcesPage() {
  try {
    console.log('🔍 Testing Resources page functionality...');
    
    // Test 1: Check if resources exist
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (resourcesError) {
      console.error('❌ Error fetching resources:', resourcesError);
      return;
    }
    
    console.log('✅ Resources found:', resources?.length || 0);
    if (resources?.length > 0) {
      console.log('📊 Sample resource:', {
        id: resources[0].id,
        title: resources[0].title,
        category: resources[0].category
      });
    }
    
    // Test 2: Check if we can create a test resource
    console.log('🔍 Testing resource creation...');
    const testResource = {
      title: 'Test Resource for Debugging',
      description: 'This is a test resource to verify the Resources page functionality',
      url: 'https://example.com',
      category: 'Other'
    };
    
    const { data: newResource, error: createError } = await supabase
      .from('resources')
      .insert(testResource)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test resource:', createError);
    } else {
      console.log('✅ Test resource created:', newResource.id);
      
      // Clean up test resource
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', newResource.id);
      
      if (deleteError) {
        console.error('❌ Error cleaning up test resource:', deleteError);
      } else {
        console.log('✅ Test resource cleaned up');
      }
    }
    
    // Test 3: Check categories
    const categories = [...new Set(resources?.map(r => r.category) || [])];
    console.log('📂 Available categories:', categories);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testResourcesPage();
