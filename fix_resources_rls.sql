-- Fix RLS policies for resources table
-- Run this in Supabase SQL Editor

-- Enable RLS on resources table if not already enabled
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON resources;
DROP POLICY IF EXISTS "Resources are insertable by authenticated users" ON resources;
DROP POLICY IF EXISTS "Resources are updatable by authenticated users" ON resources;
DROP POLICY IF EXISTS "Resources are deletable by authenticated users" ON resources;

-- Create new policies
-- Allow everyone to view resources
CREATE POLICY "Resources are viewable by everyone" ON resources
  FOR SELECT USING (true);

-- Allow authenticated users to insert resources
CREATE POLICY "Resources are insertable by authenticated users" ON resources
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update resources
CREATE POLICY "Resources are updatable by authenticated users" ON resources
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete resources
CREATE POLICY "Resources are deletable by authenticated users" ON resources
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'resources';
