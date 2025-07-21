
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseReviewFilters } from "./CourseReviewFilters";
import { CourseReviewCard } from "./CourseReviewCard";

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

export const CourseReviewsAdmin = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("unread");

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
      
      // Transform the data to match our interface
      return data.map(review => {
        // Type assertion to help TypeScript understand the structure
        const profileData = review.profiles as any;
        const courseData = review.courses as any;
        
        return {
          id: review.id,
          user_id: review.user_id,
          course_id: review.course_id,
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
          read_status: review.read_status || false,
          read_at: review.read_at,
          read_by: review.read_by,
          profiles: {
            email: profileData?.email || '',
            full_name: profileData?.full_name || null
          },
          courses: {
            title: courseData?.title || '',
            company: courseData?.company || null
          }
        } as CourseReview;
      });
    },
  });

  // Filter reviews based on selected filters
  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    
    return reviews.filter(review => {
      const courseMatch = !selectedCourse || review.course_id === selectedCourse;
      const companyMatch = !selectedCompany || review.courses.company === selectedCompany;
      return courseMatch && companyMatch;
    });
  }, [reviews, selectedCourse, selectedCompany]);

  // Separate unread and read reviews
  const unreadReviews = filteredReviews.filter(review => !review.read_status);
  const readReviews = filteredReviews.filter(review => review.read_status);

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

  const EmptyState = ({ isUnread }: { isUnread: boolean }) => (
    <div className="text-center py-12">
      <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
        No {isUnread ? 'unread' : 'read'} reviews
      </h3>
      <p className="text-muted-foreground">
        {isUnread 
          ? 'New course reviews will appear here when users submit them.'
          : 'Reviews you\'ve marked as read will appear here.'
        }
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Course Reviews</h2>
        <p className="text-muted-foreground">View and manage feedback and ratings from course participants</p>
      </div>

      <CourseReviewFilters
        onCourseChange={setSelectedCourse}
        onCompanyChange={setSelectedCompany}
        selectedCourse={selectedCourse}
        selectedCompany={selectedCompany}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unread" className="relative">
            Unread ({unreadReviews.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-6">
          {unreadReviews.length === 0 ? (
            <EmptyState isUnread={true} />
          ) : (
            <div className="grid gap-6">
              {unreadReviews.map((review) => (
                <CourseReviewCard 
                  key={review.id} 
                  review={review} 
                  showMarkAsRead={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-6">
          {readReviews.length === 0 ? (
            <EmptyState isUnread={false} />
          ) : (
            <div className="grid gap-6">
              {readReviews.map((review) => (
                <CourseReviewCard 
                  key={review.id} 
                  review={review} 
                  showMarkAsRead={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
