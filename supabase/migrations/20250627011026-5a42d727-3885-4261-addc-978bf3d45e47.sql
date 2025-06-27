
-- Create a table for resources
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policy to allow everyone to read resources
CREATE POLICY "Anyone can view resources" 
  ON public.resources 
  FOR SELECT 
  USING (true);

-- Policy to allow only admins to insert resources
CREATE POLICY "Only admins can create resources" 
  ON public.resources 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy to allow only admins to update resources
CREATE POLICY "Only admins can update resources" 
  ON public.resources 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy to allow only admins to delete resources
CREATE POLICY "Only admins can delete resources" 
  ON public.resources 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
