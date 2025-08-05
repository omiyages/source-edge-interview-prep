-- Add unique constraint on full_name to enable upsert functionality
ALTER TABLE public.candidates 
ADD CONSTRAINT candidates_full_name_unique UNIQUE (full_name);