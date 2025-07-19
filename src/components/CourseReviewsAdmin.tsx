
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CourseReview {
  id: string;
  user_id: string;
  course_id: string;
  overall_rating: number;
  stage_ratings: Array<{
    stageId: string;
    stageName: string;
    helpfulness: number;
    accuracy: number;
  }>;
  support_feedback: string | null;
  improvement_suggestions: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
  courses: {
    title: string;
    company: string | null;
  };
}

const StarDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );
};

export const CourseReviewsAdmin = () => {
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['admin-course-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles!inner(email, full_name),
          courses!inner(title, company)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching course reviews:', error);
        throw error;
      }
      
      if (!data) return [];
      
      // Transform the data to match our interface with proper type casting
      return data.map(review => ({
        id: review.id,
        user_id: review.user_id,
        course_id: review.course_id,
        overall_rating: review.overall_rating,
        stage_ratings: Array.isArray(review.stage_ratings) 
          ? review.stage_ratings as Array<{
              stageId: string;
              stageName: string;
              helpfulness: number;
              accuracy: number;
            }>
          : [],
        support_feedback: review.support_feedback,
        improvement_suggestions: review.improvement_suggestions,
        created_at: review.created_at,
        profiles: {
          email: review.profiles?.email || '',
          full_name: review.profiles?.full_name || null
        },
        courses: {
          title: review.courses?.title || '',
          company: review.courses?.company || null
        }
      })) as CourseReview[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-foreground font-semibold">Loading course reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-semibold">Error loading reviews</p>
        <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No reviews yet</h3>
        <p className="text-muted-foreground">Course reviews will appear here once users submit them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Course Reviews</h2>
        <p className="text-muted-foreground">View feedback and ratings from course participants</p>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{review.courses.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>By: {review.profiles.full_name || review.profiles.email}</span>
                    {review.courses.company && (
                      <Badge variant="outline">{review.courses.company}</Badge>
                    )}
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Overall Rating</p>
                  <StarDisplay rating={review.overall_rating} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Stage Ratings */}
              {review.stage_ratings && review.stage_ratings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Stage Ratings</h4>
                  <div className="grid gap-3">
                    {review.stage_ratings.map((stage, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <h5 className="font-medium mb-2">{stage.stageName}</h5>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Helpfulness</p>
                            <StarDisplay rating={stage.helpfulness} />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                            <StarDisplay rating={stage.accuracy} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Feedback */}
              {review.support_feedback && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Support Request</h4>
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-1">
                      "Which part of the interview process would you like more support with?"
                    </p>
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                      <p className="text-foreground">{review.support_feedback}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Improvement Suggestions */}
              {review.improvement_suggestions && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Improvement Suggestions</h4>
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-1">
                      "Do you have any suggestions for improving the course?"
                    </p>
                    <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                      <p className="text-foreground">{review.improvement_suggestions}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
