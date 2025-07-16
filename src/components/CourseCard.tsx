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
import { slugify } from "@/utils/slugify";

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
    // Navigate using slugified course title
    navigate(`/course/${slugify(course.title)}`);
  };

  return (
    <Card className="card-interactive animate-scale-in shadow-token-md hover:shadow-token-xl" onClick={handleCardClick}>
      <CardHeader className="pb-token-md">
        <div className="flex items-start justify-between gap-token-lg">
          <div className="flex-1">
            <CardTitle className="text-token-2xl mb-token-sm font-bold text-card-foreground">
              {course.title}
            </CardTitle>
            {course.description && (
              <p className="text-muted-foreground text-token-sm line-clamp-3 leading-relaxed mb-token-md">
                {course.description}
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-token-xs ml-token-lg" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(course)}
                  className="btn-touch hover-scale h-10 w-10 p-0 border-primary/20 hover:bg-primary/5"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-touch hover-scale h-10 w-10 p-0 text-destructive border-destructive/20 hover:bg-destructive/5"
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
                      className="bg-purple-gradient hover:shadow-token-lg hover:-translate-y-0.5 transition-all duration-normal text-primary-foreground font-medium btn-touch"
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
      <CardContent className="space-y-token-lg">
        {/* Progress section for non-admin users */}
        {!isAdmin && courseProgress && (
          <div className="p-token-md bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center justify-between text-token-sm text-muted-foreground mb-token-sm">
              <span className="font-medium">Progress</span>
              <span className="font-semibold text-foreground">{courseProgress.progress_percentage}%</span>
            </div>
            <Progress value={courseProgress.progress_percentage} className="h-2 mb-token-sm" />
            <div className="flex items-center gap-token-lg text-token-xs text-muted-foreground">
              <span className="flex items-center gap-token-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {courseProgress.completed_stages} completed
              </span>
              <span>{courseProgress.total_stages} total stages</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-token-sm">
          <div className="flex items-center gap-token-lg text-muted-foreground">
            <div className="flex items-center gap-token-xs">
              <BookOpen className="w-4 h-4" />
              <span>Course</span>
            </div>
            <div className="flex items-center gap-token-xs">
              <Calendar className="w-4 h-4" />
              <span>{new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {/* Show company name instead of Active/Completed */}
          <Badge 
            variant="secondary" 
            className="hover-scale bg-primary/10 text-primary border-primary/20"
          >
            {course.company || "No Company"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
