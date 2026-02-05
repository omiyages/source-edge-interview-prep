
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Lightbulb, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CourseReview {
  id: string;
  user_id: string;
  course_id: string;
  stage_ratings: Array<{
    stageId: string;
    stageName: string;
    helpfulness: number;
    accuracy: number;
  }>;
  support_feedback: string | null;
  improvement_suggestions: string | null;
  created_at: string;
  read_status: boolean;
  read_at: string | null;
  read_by: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
  courses: {
    title: string;
    company: string | null;
  };
}

interface CourseReviewCardProps {
  review: CourseReview;
  showMarkAsRead?: boolean;
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
      <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}/5</span>
    </div>
  );
};

const calculateAggregateRatings = (stageRatings: CourseReview['stage_ratings']) => {
  if (!stageRatings || stageRatings.length === 0) {
    return { helpfulness: 0, accuracy: 0 };
  }

  const totalHelpfulness = stageRatings.reduce((sum, stage) => sum + stage.helpfulness, 0);
  const totalAccuracy = stageRatings.reduce((sum, stage) => sum + stage.accuracy, 0);
  
  return {
    helpfulness: totalHelpfulness / stageRatings.length,
    accuracy: totalAccuracy / stageRatings.length
  };
};

export const CourseReviewCard = ({ review, showMarkAsRead = false }: CourseReviewCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('course_reviews')
        .update({
          read_status: true,
          read_at: new Date().toISOString(),
          read_by: user?.id
        })
        .eq('id', review.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-reviews'] });
      toast({
        title: "Review marked as read",
        description: "The review has been moved to the read tab.",
      });
    },
    onError: (error) => {
      console.error('Error marking review as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark review as read.",
        variant: "destructive",
      });
    },
  });

  const aggregateRatings = calculateAggregateRatings(review.stage_ratings);
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
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
              {!review.read_status && (
                <Badge variant="secondary">Unread</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Overall Helpfulness</p>
                <StarDisplay rating={aggregateRatings.helpfulness} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Overall Accuracy</p>
                <StarDisplay rating={aggregateRatings.accuracy} />
              </div>
            </div>
            {showMarkAsRead && !review.read_status && (
              <Button
                size="sm"
                onClick={() => markAsReadMutation.mutate()}
                disabled={markAsReadMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark as Read
              </Button>
            )}
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
  );
};
