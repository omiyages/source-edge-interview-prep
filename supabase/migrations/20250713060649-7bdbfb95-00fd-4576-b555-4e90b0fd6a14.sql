
-- Add new fields to courses table
ALTER TABLE public.courses 
ADD COLUMN company TEXT,
ADD COLUMN attached_jobs TEXT[] DEFAULT '{}';
