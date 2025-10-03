
-- Add access_token column to google_sheets_integrations table
ALTER TABLE public.google_sheets_integrations 
ADD COLUMN access_token TEXT;
