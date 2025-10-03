// Add resources via Supabase API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

const supabase = createClient(supabaseUrl, supabaseKey);

const testResources = [
  {
    title: 'React Fundamentals',
    description: 'Learn the basics of React including components, state, and props',
    url: 'https://react.dev/learn',
    category: 'Frontend'
  },
  {
    title: 'JavaScript ES6+',
    description: 'Modern JavaScript features including arrow functions, destructuring, and modules',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    category: 'Frontend'
  },
  {
    title: 'Node.js Backend Development',
    description: 'Server-side JavaScript with Node.js, Express, and databases',
    url: 'https://nodejs.org/en/docs/',
    category: 'Backend'
  },
  {
    title: 'Database Design',
    description: 'SQL fundamentals, database design principles, and optimization',
    url: 'https://www.postgresql.org/docs/',
    category: 'Database'
  },
  {
    title: 'System Design',
    description: 'Large-scale system architecture, scalability, and performance',
    url: 'https://github.com/donnemartin/system-design-primer',
    category: 'Architecture'
  }
];

async function addResources() {
  try {
    console.log('🔍 Adding test resources...');
    
    const { data, error } = await supabase
      .from('resources')
      .insert(testResources)
      .select();
    
    if (error) {
      console.error('❌ Error adding resources:', error);
      return;
    }
    
    console.log('✅ Resources added successfully:', data?.length || 0);
    console.log('📊 Added resources:', data?.map(r => ({ id: r.id, title: r.title, category: r.category })));
    
    // Verify the resources were added
    const { data: allResources, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching resources:', fetchError);
      return;
    }
    
    console.log('✅ Total resources in database:', allResources?.length || 0);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addResources();
