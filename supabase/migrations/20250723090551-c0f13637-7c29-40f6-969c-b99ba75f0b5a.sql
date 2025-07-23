
-- Add created_at and updated_at fields to candidate_pipeline table
ALTER TABLE public.candidate_pipeline 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a trigger to automatically update the updated_at field when a record is modified
CREATE OR REPLACE FUNCTION public.update_candidate_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_candidate_pipeline_updated_at_trigger ON public.candidate_pipeline;
CREATE TRIGGER update_candidate_pipeline_updated_at_trigger
  BEFORE UPDATE ON public.candidate_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_candidate_pipeline_updated_at();

-- Add notes field to profiles table if it doesn't exist (for candidate notes)
-- This field already exists as text[] but we'll add a simple text field for general notes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS general_notes TEXT DEFAULT '';
