import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle } from "lucide-react";

interface AssignedCourse {
  id: string;
  course_id: string;
  assigned_at: string;
  courses: {
    id: string;
    title: string;
    description: string | null;
  };
}

interface CourseProgress {
  course_id: string;
  total_stages: number;
  completed_stages: number;
  progress_percentage: number;
}

const UserDashboard = () => {
  const { user, loading, isAdmin } = useAuth();

  console.log('🎯 UserDashboard Debug:', {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    isAdmin,
    currentUrl: window.location.pathname
  });

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    console.log('🚫 UserDashboard: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect admins to admin dashboard  
  if (!loading && user && isAdmin) {
    console.log('🚫 UserDashboard: User is admin, redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }

  const { data: assignedCourses, isLoading } = useQuery({
    queryKey: ['user-assigned-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', user?.id)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data as AssignedCourse[];
    },
    enabled: !!user,
  });

  const { data: courseProgress } = useQuery({
    queryKey: ['user-course-progress'],
    queryFn: async () => {
      if (!assignedCourses?.length) return [];

      const courseIds = assignedCourses.map(ac => ac.course_id);
      
      // Get total stages for each course
      const { data: allStages, error: stagesError } = await supabase
        .from('course_stages')
        .select('course_id')
        .in('course_id', courseIds);

      if (stagesError) throw stagesError;

      // Get completed stages for user
      const { data: completedStages, error: progressError } = await supabase
        .from('user_progress')
        .select('course_id, stage_id')
        .eq('user_id', user?.id)
        .in('course_id', courseIds);

      if (progressError) throw progressError;

      // Calculate progress for each course
      const progressMap: { [courseId: string]: CourseProgress } = {};

      courseIds.forEach(courseId => {
        const totalStages = allStages?.filter(s => s.course_id === courseId).length || 0;
        const completed = completedStages?.filter(s => s.course_id === courseId).length || 0;
        const percentage = totalStages > 0 ? Math.round((completed / totalStages) * 100) : 0;

        progressMap[courseId] = {
          course_id: courseId,
          total_stages: totalStages,
          completed_stages: completed,
          progress_percentage: percentage
        };
      });

      return Object.values(progressMap);
    },
    enabled: !!user && !!assignedCourses?.length,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getProgressForCourse = (courseId: string) => {
    return courseProgress?.find(p => p.course_id === courseId) || {
      course_id: courseId,
      total_stages: 0,
      completed_stages: 0,
      progress_percentage: 0
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">My Learning Dashboard</h1>
            <p className="text-foreground font-semibold">Track your progress and continue your learning journey</p>
          </div>
          <Link to="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>

        {!assignedCourses?.length ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Assigned</h3>
              <p className="text-gray-600 mb-4">
                You don't have any courses assigned yet. Contact your administrator to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {assignedCourses.map((assignment) => {
              const progress = getProgressForCourse(assignment.course_id);
              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow min-h-[320px] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="line-clamp-2">{assignment.courses.title}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 min-h-[3rem]">
                      {assignment.courses.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-between flex-1 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{progress.progress_percentage}%</span>
                        </div>
                        <Progress value={progress.progress_percentage} className="h-2" />
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {progress.completed_stages} completed
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {progress.total_stages} total stages
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </div>

                    <Link to={`/course/${assignment.course_id}`} className="block mt-auto">
                      <Button className="w-full">
                        {progress.progress_percentage === 100 ? "Review Course" : "Continue Learning"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;