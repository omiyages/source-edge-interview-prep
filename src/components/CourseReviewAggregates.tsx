
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface CourseReviewAggregatesProps {
  selectedCourse: string | null;
  selectedCompany: string | null;
}

interface CourseReview {
  id: string;
  course_id: string;
  stage_ratings: Array<{
    stageId: string;
    stageName: string;
    helpfulness: number;
    accuracy: number;
  }>;
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
          className={`h-5 w-5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className="ml-2 text-lg font-semibold">{rating.toFixed(1)}/5</span>
    </div>
  );
};

export const CourseReviewAggregates = ({ 
  selectedCourse, 
  selectedCompany 
}: CourseReviewAggregatesProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['course-review-aggregates', selectedCourse, selectedCompany],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_reviews')
        .select(`
          id,
          course_id,
          stage_ratings,
          courses!inner(title, company)
        `);
      
      if (error) {
        console.error('Error fetching course reviews for aggregates:', error);
        throw error;
      }
      
      if (!data) return [];
      
      return data.map(review => {
        const courseData = review.courses as any;
        
        return {
          id: review.id,
          course_id: review.course_id,
          stage_ratings: Array.isArray(review.stage_ratings) 
            ? review.stage_ratings as Array<{
                stageId: string;
                stageName: string;
                helpfulness: number;
                accuracy: number;
              }>
            : [],
          courses: {
            title: courseData?.title || '',
            company: courseData?.company || null
          }
        } as CourseReview;
      });
    },
  });

  const aggregateRatings = useMemo(() => {
    if (!reviews) return { helpfulness: 0, accuracy: 0, totalReviews: 0, courseTitle: null };
    
    // Filter reviews based on selected filters
    const filteredReviews = reviews.filter(review => {
      const courseMatch = !selectedCourse || review.course_id === selectedCourse;
      const companyMatch = !selectedCompany || review.courses.company === selectedCompany;
      return courseMatch && companyMatch;
    });

    if (filteredReviews.length === 0) {
      return { helpfulness: 0, accuracy: 0, totalReviews: 0, courseTitle: null };
    }

    let totalHelpfulness = 0;
    let totalAccuracy = 0;
    let totalRatings = 0;

    filteredReviews.forEach(review => {
      review.stage_ratings.forEach(stage => {
        totalHelpfulness += stage.helpfulness;
        totalAccuracy += stage.accuracy;
        totalRatings += 1;
      });
    });

    // Get the course title from the first filtered review if a specific course is selected
    const courseTitle = selectedCourse && filteredReviews.length > 0 
      ? filteredReviews[0].courses.title 
      : null;

    return {
      helpfulness: totalRatings > 0 ? totalHelpfulness / totalRatings : 0,
      accuracy: totalRatings > 0 ? totalAccuracy / totalRatings : 0,
      totalReviews: filteredReviews.length,
      courseTitle
    };
  }, [reviews, selectedCourse, selectedCompany]);

  const getFilterTitle = () => {
    if (selectedCourse && selectedCompany) {
      return `${aggregateRatings.courseTitle || 'Selected Course'} (${selectedCompany})`;
    } else if (selectedCourse) {
      return aggregateRatings.courseTitle || 'Selected Course';
    } else if (selectedCompany) {
      return `All courses from ${selectedCompany}`;
    }
    return "All Courses";
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          Aggregate Ratings - {getFilterTitle()}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on {aggregateRatings.totalReviews} review{aggregateRatings.totalReviews !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        {aggregateRatings.totalReviews === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No reviews available for the selected criteria
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Overall Helpfulness
              </p>
              <StarDisplay rating={aggregateRatings.helpfulness} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Overall Accuracy
              </p>
              <StarDisplay rating={aggregateRatings.accuracy} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
