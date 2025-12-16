
// ABOUTME: Modern card component for displaying course information with LMS-inspired design
// ABOUTME: Features clean layout, progress tracking, and admin controls with enhanced visual styling

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, ArrowRight } from "lucide-react";
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
    <Card className="bg-white border border-border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer" onClick={handleCardClick}>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header with ellipsis menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
              {course.title}
            </h3>
          </div>
          {isAdmin && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(course)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
            {course.description}
          </p>
        )}

        {/* Tags/Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {course.company && (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs"
            >
              {course.company}
            </Badge>
          )}
          {/* Show progress badge for non-admin users */}
          {!isAdmin && courseProgress && (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs"
            >
              {courseProgress.progress_percentage}% Complete
            </Badge>
          )}
        </div>

        {/* View Course Button */}
        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full bg-white hover:bg-gray-50"
          >
            View Course
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
