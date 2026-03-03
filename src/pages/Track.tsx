
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateCourseForm } from "@/components/CreateCourseForm";
import { CourseCard } from "@/components/CourseCard";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { NavigationHeader } from "@/components/NavigationHeader";

interface Course {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  attached_jobs: string[] | null;
  created_at: string;
  created_by: string | null;
}

const Track = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const isAuthenticated = !loading && !!user;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, company, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching courses:', error);
        throw error;
      }
      
      return data as Course[];
    },
    enabled: !loading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const courseIds = courses?.map((course) => course.id) ?? [];

  const { data: courseProgressById = {} } = useQuery<
    Record<string, { total_stages: number; completed_stages: number; progress_percentage: number }>
  >({
    queryKey: ['track-course-progress', user?.id, courseIds],
    queryFn: async () => {
      if (!user || isAdmin || courseIds.length === 0) return {};

      const [{ data: stageRows, error: stageError }, { data: progressRows, error: progressError }] =
        await Promise.all([
          supabase.from('course_stages').select('course_id').in('course_id', courseIds),
          supabase
            .from('user_progress')
            .select('course_id')
            .eq('user_id', user.id)
            .in('course_id', courseIds),
        ]);

      if (stageError) throw stageError;
      if (progressError) throw progressError;

      const stageCountByCourse: Record<string, number> = {};
      const completedByCourse: Record<string, number> = {};

      for (const row of stageRows ?? []) {
        stageCountByCourse[row.course_id] = (stageCountByCourse[row.course_id] ?? 0) + 1;
      }

      for (const row of progressRows ?? []) {
        completedByCourse[row.course_id] = (completedByCourse[row.course_id] ?? 0) + 1;
      }

      return courseIds.reduce<
        Record<string, { total_stages: number; completed_stages: number; progress_percentage: number }>
      >((acc, courseId) => {
        const totalStages = stageCountByCourse[courseId] ?? 0;
        const completedStages = completedByCourse[courseId] ?? 0;
        acc[courseId] = {
          total_stages: totalStages,
          completed_stages: completedStages,
          progress_percentage: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
        };
        return acc;
      }, {});
    },
    enabled: !!user && !isAdmin && courseIds.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground font-semibold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground mb-4">
            Interview Tracks
          </h1>
          <p className="text-lg text-foreground font-semibold max-w-2xl mx-auto">
            Structured interview preparation courses with organized stages and curated questions.
          </p>
          {isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-2">
              Welcome back, {profile?.full_name || profile?.email} ({profile?.role})
              {isAdmin && <span className="text-primary font-semibold ml-2">👑 Admin</span>}
            </p>
          )}
        </div>

        {/* Create Course Button for Admins */}
        {isAdmin && (
          <div className="flex justify-center mb-8">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <CreateCourseForm 
                  onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    refetch();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <LoadingSkeleton lines={1} className="mb-2" />
                <LoadingSkeleton lines={3} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses?.map((course) => (
              <CourseCard key={course.id} course={course} progress={courseProgressById[course.id] ?? null} />
            ))}
          </div>
        )}

        {courses?.length === 0 && !isLoading && (
          <EmptyState
            title="No courses available yet"
            description={isAdmin ? "Create your first course to get started." : "Check back later for new courses."}
            icon={<BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Track;
