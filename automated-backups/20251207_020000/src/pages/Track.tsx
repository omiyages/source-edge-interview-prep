
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateCourseForm } from "@/components/CreateCourseForm";
import { CourseCard } from "@/components/CourseCard";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching courses:', error);
        throw error;
      }
      
      return data as Course[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tracks' }]} className="mb-4" />
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
            </Link>
            <h1 className="text-4xl font-black text-foreground">
              Interview Tracks
            </h1>
            <div className="w-32"></div> {/* Spacer to center the title */}
          </div>
          <p className="text-lg text-foreground font-semibold max-w-2xl mx-auto">
            Structured interview preparation courses with organized stages and curated questions.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome back, {profile?.email} ({profile?.role})
            {isAdmin && <span className="text-primary font-semibold ml-2">👑 Admin</span>}
          </p>
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
              <CourseCard key={course.id} course={course} />
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
    </div>
  );
};

export default Track;
