
-- Create a table to store Google Sheets integration settings
CREATE TABLE public.google_sheets_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  sheet_id TEXT NOT NULL,
  sheet_name TEXT,
  range_specification TEXT DEFAULT 'A:Z',
  column_mappings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.google_sheets_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations" 
  ON public.google_sheets_integrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations" 
  ON public.google_sheets_integrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" 
  ON public.google_sheets_integrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" 
  ON public.google_sheets_integrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a table to track imported candidates from Google Sheets
CREATE TABLE public.google_sheets_candidate_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.google_sheets_integrations(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sheet_row_number INTEGER,
  import_data JSONB,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, sheet_row_number)
);

-- Add RLS policies for imports
ALTER TABLE public.google_sheets_candidate_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own imports" 
  ON public.google_sheets_candidate_imports 
  FOR SELECT 
  USING (
    integration_id IN (
      SELECT id FROM public.google_sheets_integrations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own imports" 
  ON public.google_sheets_candidate_imports 
  FOR INSERT 
  WITH CHECK (
    integration_id IN (
      SELECT id FROM public.google_sheets_integrations 
      WHERE user_id = auth.uid()
    )
  );
