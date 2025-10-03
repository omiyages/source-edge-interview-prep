// Debug script to check resource loading in course management
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugResourceLoading() {
  try {
    console.log('🔍 Debugging resource loading...');
    
    // Test 1: Check total resources
    const { data: allResources, error: allError } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error fetching all resources:', allError);
      return;
    }
    
    console.log('✅ Total resources in database:', allResources?.length || 0);
    console.log('📊 All resources:', allResources?.map(r => ({ id: r.id, title: r.title, category: r.category })));
    
    // Test 2: Check if there are any stage_resources assignments
    const { data: stageResources, error: stageError } = await supabase
      .from('stage_resources')
      .select('*');
    
    if (stageError) {
      console.error('❌ Error fetching stage resources:', stageError);
      return;
    }
    
    console.log('✅ Stage resource assignments:', stageResources?.length || 0);
    console.log('📊 Stage assignments:', stageResources);
    
    // Test 3: Check specific stage if provided
    const testStageId = 'your-stage-id-here'; // Replace with actual stage ID
    if (testStageId !== 'your-stage-id-here') {
      const { data: specificStageResources, error: specificError } = await supabase
        .from('stage_resources')
        .select('*')
        .eq('stage_id', testStageId);
      
      if (specificError) {
        console.error('❌ Error fetching specific stage resources:', specificError);
      } else {
        console.log(`✅ Resources for stage ${testStageId}:`, specificStageResources?.length || 0);
        console.log('📊 Specific stage resources:', specificStageResources);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugResourceLoading();
