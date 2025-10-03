-- Create course reviews table to store user feedback
CREATE TABLE public.course_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  stage_ratings JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_feedback TEXT,
  improvement_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own reviews" 
ON public.course_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviews" 
ON public.course_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.course_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews" 
ON public.course_reviews 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_course_reviews_updated_at
BEFORE UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();