
// ABOUTME: Modern card component for displaying course information with LMS-inspired design
// ABOUTME: Features clean layout, progress tracking, and admin controls with enhanced visual styling

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, Edit, Trash2, CheckCircle, Users, Clock } from "lucide-react";
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-gray-300";
  };

  return (
    <Card className="group relative bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden" onClick={handleCardClick}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-primary/10 pointer-events-none" />
      
      {/* Progress indicator bar at top */}
      {!isAdmin && courseProgress && (
        <div className="absolute top-0 left-0 right-0 h-1">
          <div 
            className={`h-full ${getProgressColor(courseProgress.progress_percentage)} transition-all duration-500`}
            style={{ width: `${courseProgress.progress_percentage}%` }}
          />
        </div>
      )}

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 mb-2 leading-tight">
              {course.title}
            </CardTitle>
            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(course)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
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
                      className="bg-red-600 hover:bg-red-700 text-white"
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

      <CardContent className="relative space-y-4">
        {/* Progress section for non-admin users */}
        {!isAdmin && courseProgress && (
          <div className="bg-secondary rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-semibold text-foreground">{courseProgress.progress_percentage}%</span>
            </div>
            
            {/* Custom progress bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(courseProgress.progress_percentage)}`}
                style={{ width: `${courseProgress.progress_percentage}%` }}
              />
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {courseProgress.completed_stages} completed
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {courseProgress.total_stages} total stages
              </span>
            </div>
          </div>
        )}
        
        {/* Course metadata */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(course.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Course</span>
            </div>
          </div>
          
          {/* Company badge */}
          <Badge 
            variant="secondary" 
            className="font-medium px-2 py-1 text-xs"
          >
            {course.company || "No Company"}
          </Badge>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
};
