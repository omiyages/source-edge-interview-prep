
-- Add read_status tracking to course_reviews table
ALTER TABLE public.course_reviews 
ADD COLUMN read_status boolean NOT NULL DEFAULT false,
ADD COLUMN read_at timestamp with time zone,
ADD COLUMN read_by uuid;

-- Update RLS policies to allow admins to update read status
CREATE POLICY "Admins can update read status" 
ON public.course_reviews 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));
