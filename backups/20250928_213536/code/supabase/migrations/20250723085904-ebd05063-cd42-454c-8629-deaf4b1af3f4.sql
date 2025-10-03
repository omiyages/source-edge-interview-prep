
-- Add the new "New Candidate" stage at the beginning
INSERT INTO public.hiring_stages (name, stage_order, color) 
VALUES ('New Candidate', 0, '#9ca3af')
ON CONFLICT DO NOTHING;

-- Update existing stages to shift their order by 1
UPDATE public.hiring_stages 
SET stage_order = stage_order + 1 
WHERE name != 'New Candidate';
