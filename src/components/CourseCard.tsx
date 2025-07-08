
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, Edit, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import type { Course } from "@/types/course";

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
}

export const CourseCard = ({ course, onEdit }: CourseCardProps) => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch course progress for the current user
  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', course.id, user?.id],
    queryFn: async () => {
      if (!user || isAdmin) return null;

      // Get total stages for this course
      const { data: stages, error: stagesError } = await supabase
        .from('course_stages')
        .select('id')
        .eq('course_id', course.id);

      if (stagesError) throw stagesError;

      // Get completed stages for user
      const { data: completedStages, error: progressError } = await supabase
        .from('user_progress')
        .select('stage_id')
        .eq('user_id', user.id)
        .eq('course_id', course.id);

      if (progressError) throw progressError;

      const totalStages = stages?.length || 0;
      const completed = completedStages?.length || 0;
      const percentage = totalStages > 0 ? Math.round((completed / totalStages) * 100) : 0;

      return {
        total_stages: totalStages,
        completed_stages: completed,
        progress_percentage: percentage
      };
    },
    enabled: !!user && !isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First delete all stages associated with this course
      const { error: stagesError } = await supabase
        .from('course_stages')
        .delete()
        .eq('course_id', course.id);
      
      if (stagesError) throw stagesError;

      // Then delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: "Course deleted",
        description: "The course and all its stages have been deleted.",
      });
    },
    onError: (error) => {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCardClick = () => {
    // Fix: Navigate to the correct route that matches App.tsx
    navigate(`/course/${course.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
            {course.description && (
              <p className="text-gray-600 text-sm line-clamp-3">
                {course.description}
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(course)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Course</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this course? This will also delete all stages and questions associated with it. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress section for non-admin users */}
        {!isAdmin && courseProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{courseProgress.progress_percentage}%</span>
            </div>
            <Progress value={courseProgress.progress_percentage} className="h-2 mb-2" />
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {courseProgress.completed_stages} completed
              </span>
              <span>{courseProgress.total_stages} total stages</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>Course</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge variant="secondary" className={`${
            !isAdmin && courseProgress?.progress_percentage === 100 
              ? "bg-green-100 text-green-800" 
              : "bg-blue-100 text-blue-800"
          }`}>
            {!isAdmin && courseProgress?.progress_percentage === 100 ? "Completed" : "Active"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
