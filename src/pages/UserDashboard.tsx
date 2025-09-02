
// ABOUTME: User dashboard page component for regular users  
// ABOUTME: Redirects admin users to admin dashboard automatically

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, LogOut, Home, CheckCircle } from 'lucide-react';
import { slugify } from '@/utils/slugify';

const UserDashboard = () => {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  console.log('🎯 UserDashboard Debug:', {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    isAdmin,
    currentUrl: window.location.pathname
  });

  // Handle admin redirect
  useEffect(() => {
    if (!loading && isAdmin) {
      console.log('🚫 UserDashboard: User is admin, redirecting to admin dashboard');
      navigate('/admin', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  // Fetch user's assigned courses with progress calculation
  const { data: assignedCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['user-assigned-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get assigned courses
      const { data: assignments, error: assignmentError } = await supabase
        .from('course_assignments')
        .select(`
          id,
          course_id,
          courses(
            id,
            title,
            description
          )
        `)
        .eq('user_id', user.id);
        
      if (assignmentError) throw assignmentError;

      // For each course, calculate progress
      const coursesWithProgress = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const courseId = assignment.course_id;
          
          // Get total stages for this course
          const { data: stages, error: stagesError } = await supabase
            .from('course_stages')
            .select('id')
            .eq('course_id', courseId);
            
          if (stagesError) throw stagesError;
          
          // Get completed stages for this user and course
          const { data: completedStages, error: progressError } = await supabase
            .from('user_progress')
            .select('stage_id')
            .eq('user_id', user.id)
            .eq('course_id', courseId);
            
          if (progressError) throw progressError;
          
          const totalStages = stages?.length || 0;
          const completed = completedStages?.length || 0;
          const progressPercentage = totalStages > 0 ? Math.round((completed / totalStages) * 100) : 0;
          
          return {
            ...assignment,
            totalStages,
            completedStages: completed,
            progressPercentage
          };
        })
      );
      
      return coursesWithProgress;
    },
    enabled: !!user && !isAdmin,
  });

  // Show loading state while authentication is being resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is admin (will redirect)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Render user dashboard for regular users
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-foreground mb-2">
              Your Dashboard
            </h1>
            <p className="text-lg text-foreground font-semibold">
              Welcome back, {profile?.email || user?.email}
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="progress">
              <TrendingUp className="w-4 h-4 mr-2" />
              Your Progress
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Assigned Courses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            {coursesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-foreground font-semibold">Loading your progress...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignedCourses?.map((assignment) => (
                  <Card key={assignment.course_id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg leading-tight">
                        {assignment.courses?.title || 'Course'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Progress</span>
                          <span className="text-lg font-semibold text-foreground">
                            {assignment.progressPercentage}%
                          </span>
                        </div>
                        
                        <Progress value={assignment.progressPercentage} className="h-3" />
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {assignment.completedStages} completed
                          </span>
                          <span>{assignment.totalStages} total stages</span>
                        </div>
                        
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => navigate(`/course/${slugify(assignment.courses?.title || '')}`)}
                        >
                          Continue Learning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {assignedCourses?.length === 0 && !coursesLoading && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No progress yet</h3>
                <p className="text-muted-foreground">Start learning to see your progress here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="courses">
            {coursesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-foreground font-semibold">Loading your courses...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignedCourses?.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg leading-tight">
                        {assignment.courses?.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {assignment.courses?.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-medium">{assignment.progressPercentage}%</span>
                        </div>
                        
                        <Progress value={assignment.progressPercentage} className="h-2" />
                        
                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/course/${slugify(assignment.courses?.title || '')}`)}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {assignment.progressPercentage > 0 ? 'Continue Course' : 'Start Course'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {assignedCourses?.length === 0 && !coursesLoading && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No courses assigned</h3>
                <p className="text-muted-foreground">Contact your administrator to get course assignments.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
