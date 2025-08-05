-- Remove duplicate candidates, keeping the most recent one
DELETE FROM public.candidates 
WHERE id NOT IN (
  SELECT DISTINCT ON (full_name) id 
  FROM public.candidates 
  ORDER BY full_name, created_at DESC
);

-- Add unique constraint on full_name to enable upsert functionality
ALTER TABLE public.candidates 
ADD CONSTRAINT candidates_full_name_unique UNIQUE (full_name);