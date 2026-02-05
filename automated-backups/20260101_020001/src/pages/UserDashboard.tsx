
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
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { NavigationHeader } from '@/components/NavigationHeader';

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
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-semibold">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is admin (will redirect)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-semibold">Redirecting to admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render user dashboard for regular users
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} className="mb-4" />
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-foreground mb-2">
              Your Dashboard
            </h1>
            <p className="text-lg text-foreground font-semibold">
              Welcome back, {profile?.full_name || profile?.email || user?.email}
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
            {coursesLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <LoadingSkeleton lines={1} className="mb-2" />
                      <LoadingSkeleton lines={1} />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LoadingSkeleton lines={3} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!coursesLoading && (assignedCourses?.length ?? 0) > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignedCourses?.map((assignment) => (
                  <Card key={assignment.course_id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg leading-tight">
                          {assignment.courses?.title || 'Course'}
                        </CardTitle>
                        <div className="relative inline-flex items-center justify-center">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                            <path className="text-muted stroke-current" strokeWidth="3" fill="none" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path className="text-primary stroke-current" strokeWidth="3" strokeLinecap="round" fill="none"
                              strokeDasharray={`${assignment.progressPercentage}, 100`}
                              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                          </svg>
                          <span className="absolute text-xs font-semibold">{assignment.progressPercentage}%</span>
                        </div>
                      </div>
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
                          Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!coursesLoading && (assignedCourses?.length ?? 0) === 0 && (
              <EmptyState
                title="No progress yet"
                description="Start learning to see your progress here."
                icon={<TrendingUp className="w-16 h-16 mx-auto text-muted-foreground" />}
              />
            )}
          </TabsContent>

          <TabsContent value="courses">
            {coursesLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <LoadingSkeleton lines={1} className="mb-2" />
                      <LoadingSkeleton lines={1} />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LoadingSkeleton lines={3} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!coursesLoading && (assignedCourses?.length ?? 0) > 0 && (
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

            {!coursesLoading && (assignedCourses?.length ?? 0) === 0 && (
              <EmptyState
                title="No courses assigned"
                description="Contact your administrator to get course assignments."
                icon={<BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Source Edge Database. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;
