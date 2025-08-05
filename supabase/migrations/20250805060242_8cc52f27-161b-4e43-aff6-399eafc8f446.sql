-- Add sheet_row_id to candidate_pipeline for Google Sheets sync upserts
ALTER TABLE public.candidate_pipeline 
ADD COLUMN sheet_row_id text;

-- Add unique constraint on sheet_row_id for upsert functionality
ALTER TABLE public.candidate_pipeline 
ADD CONSTRAINT candidate_pipeline_sheet_row_id_unique UNIQUE (sheet_row_id);