// Migration script to create page_resources table
// Run this with: node run_page_resources_migration.js

const supabaseUrl = 'https://satshobhbkjptsbmfsia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c';

async function runMigration() {
  console.log('🚀 Starting page_resources migration...');
  console.log('');
  console.log('⚠️  Note: You need to run this SQL manually in your Supabase dashboard.');
  console.log('');
  console.log('📋 Copy and paste this SQL into your Supabase SQL Editor:');
  console.log('');
  console.log('-- Create a table to link resources to pages');
  console.log('CREATE TABLE IF NOT EXISTS public.page_resources (');
  console.log('  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,');
  console.log('  page_identifier TEXT NOT NULL,');
  console.log('  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,');
  console.log('  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),');
  console.log('  UNIQUE(page_identifier, resource_id)');
  console.log(');');
  console.log('');
  console.log('-- Enable Row Level Security');
  console.log('ALTER TABLE public.page_resources ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('-- Create policies for page_resources');
  console.log('DROP POLICY IF EXISTS "Anyone can view page resources" ON public.page_resources;');
  console.log('CREATE POLICY "Anyone can view page resources"');
  console.log('  ON public.page_resources');
  console.log('  FOR SELECT');
  console.log('  TO authenticated');
  console.log('  USING (true);');
  console.log('');
  console.log('DROP POLICY IF EXISTS "Admins can manage page resources" ON public.page_resources;');
  console.log('CREATE POLICY "Admins can manage page resources"');
  console.log('  ON public.page_resources');
  console.log('  FOR ALL');
  console.log('  TO authenticated');
  console.log('  USING (');
  console.log('    EXISTS (');
  console.log('      SELECT 1 FROM public.profiles');
  console.log('      WHERE id = auth.uid() AND role = \'admin\'');
  console.log('    )');
  console.log('  );');
  console.log('');
  console.log('-- Add index for better performance');
  console.log('CREATE INDEX IF NOT EXISTS idx_page_resources_page_identifier ON public.page_resources(page_identifier);');
  console.log('CREATE INDEX IF NOT EXISTS idx_page_resources_resource_id ON public.page_resources(resource_id);');
  console.log('');
  console.log('✅ Migration SQL ready to copy!');
  console.log('');
  console.log('📝 Steps to apply:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy the SQL above');
  console.log('4. Paste and run it');
  console.log('');
}

runMigration();




