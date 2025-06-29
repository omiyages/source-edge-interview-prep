
-- Create a table to link resources to course stages
CREATE TABLE public.stage_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.course_stages(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stage_id, resource_id)
);

-- Enable Row Level Security
ALTER TABLE public.stage_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for stage_resources
CREATE POLICY "Anyone can view stage resources"
  ON public.stage_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage stage resources"
  ON public.stage_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add index for better performance
CREATE INDEX idx_stage_resources_stage_id ON public.stage_resources(stage_id);
CREATE INDEX idx_stage_resources_resource_id ON public.stage_resources(resource_id);
