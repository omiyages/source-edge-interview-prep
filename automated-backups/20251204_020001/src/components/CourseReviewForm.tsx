
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StarRating } from "./StarRating";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeForDisplay } from "@/utils/xssProtection";

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

interface CourseReviewFormProps {
  courseId: string;
  stages: CourseStage[];
  onReviewSubmitted?: () => void;
}

const stageRatingSchema = z.object({
  stageId: z.string(),
  stageName: z.string(),
  helpfulness: z.number().min(1).max(5),
  accuracy: z.number().min(1).max(5),
});

const reviewFormSchema = z.object({
  stageRatings: z.array(stageRatingSchema),
  supportFeedback: z.string().max(1000, "Support feedback must be less than 1000 characters").optional(),
  improvementSuggestions: z.string().max(1000, "Improvement suggestions must be less than 1000 characters").optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

export const CourseReviewForm = ({ courseId, stages, onReviewSubmitted }: CourseReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      stageRatings: stages.map(stage => ({
        stageId: stage.id,
        stageName: stage.title,
        helpfulness: 1,
        accuracy: 1,
      })),
      supportFeedback: "",
      improvementSuggestions: "",
    },
  });

  // Check if user has already submitted a review
  useEffect(() => {
    const fetchExistingReview = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching existing review:', error);
        return;
      }

      if (data) {
        setExistingReview(data);
        // Pre-populate form with existing data
        const stageRatings = Array.isArray(data.stage_ratings) 
          ? data.stage_ratings as Array<{stageId: string; stageName: string; helpfulness: number; accuracy: number}>
          : stages.map(stage => ({
              stageId: stage.id,
              stageName: stage.title,
              helpfulness: 1,
              accuracy: 1,
            }));
            
        form.reset({
          stageRatings,
          supportFeedback: data.support_feedback || "",
          improvementSuggestions: data.improvement_suggestions || "",
        });
      }
    };

    fetchExistingReview();
  }, [user, courseId, form]);

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize input data before submission
      const reviewData = {
        user_id: user.id,
        course_id: courseId,
        stage_ratings: data.stageRatings,
        support_feedback: data.supportFeedback ? sanitizeForDisplay(data.supportFeedback) : null,
        improvement_suggestions: data.improvementSuggestions ? sanitizeForDisplay(data.improvementSuggestions) : null,
      };

      let result;
      if (existingReview) {
        // Update existing review
        result = await supabase
          .from('course_reviews')
          .update(reviewData)
          .eq('id', existingReview.id);
      } else {
        // Insert new review
        result = await supabase
          .from('course_reviews')
          .insert(reviewData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: existingReview ? "Review updated" : "Review submitted",
        description: "Thank you for your feedback!",
      });

      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Review this Course
        </CardTitle>
        <p className="text-muted-foreground text-center">
          Help us improve by sharing your feedback
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Stage Ratings */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Rate Each Stage</h3>
              {stages.map((stage, index) => (
                <div key={stage.id} className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium text-base">{stage.title}</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`stageRatings.${index}.helpfulness`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            How helpful was this stage?
                          </FormLabel>
                          <FormControl>
                            <StarRating
                              rating={field.value}
                              onRatingChange={field.onChange}
                              size="md"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`stageRatings.${index}.accuracy`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            How accurate was the content?
                          </FormLabel>
                          <FormControl>
                            <StarRating
                              rating={field.value}
                              onRatingChange={field.onChange}
                              size="md"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Open-ended Questions */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Additional Feedback</h3>
              
              <FormField
                control={form.control}
                name="supportFeedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Which part of the interview process would you like more support with?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="We'll get back to you as quickly as possible to help."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="improvementSuggestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Do you have any suggestions for improving the course?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your ideas for making this course better..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting 
                  ? (existingReview ? "Updating..." : "Submitting...") 
                  : (existingReview ? "Update Review" : "Submit Review")
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
