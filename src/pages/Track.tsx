
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

interface Course {
  id: string;
  title: string;
  description: string | null;
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
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">
              Interview Tracks
            </h1>
            <div className="w-32"></div> {/* Spacer to center the title */}
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Structured interview preparation courses with organized stages and curated questions.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Welcome back, {profile?.email} ({profile?.role})
            {isAdmin && <span className="text-purple-600 font-semibold ml-2">👑 Admin</span>}
          </p>
        </div>

        {/* Create Course Button for Admins */}
        {isAdmin && (
          <div className="flex justify-center mb-8">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium">
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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {courses?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No courses available yet</h3>
            <p className="text-gray-500">
              {isAdmin ? "Create your first course to get started." : "Check back later for new courses."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
