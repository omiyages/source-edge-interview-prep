-- Create stage templates table
CREATE TABLE public.stage_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  description text,
  information text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stage_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for stage templates
CREATE POLICY "Admins can manage all stage templates" 
ON public.stage_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view stage templates" 
ON public.stage_templates 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stage_templates_updated_at
BEFORE UPDATE ON public.stage_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();