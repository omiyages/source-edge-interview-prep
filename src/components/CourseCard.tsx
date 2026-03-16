
// ABOUTME: Modern card component for displaying course information with LMS-inspired design
// ABOUTME: Features clean layout, progress tracking, and admin controls with enhanced visual styling

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import type { Course } from "@/types/course";
import { slugify } from "@/utils/slugify";

// Different leaf SVG designs
const LeafDesigns = {
  simple: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <path d="M32 4C20 4 10 20 10 36C10 52 20 60 32 60C44 60 54 52 54 36C54 20 44 4 32 4Z" fillOpacity="0.9"/>
      <path d="M32 12C32 12 28 28 32 48" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 24C28 22 24 24 22 28" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 32C36 30 40 32 42 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  rounded: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <ellipse cx="32" cy="34" rx="20" ry="24" fillOpacity="0.9"/>
      <path d="M32 14V54" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 26C26 24 20 28 18 34" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 38C38 36 44 40 46 46" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  pointed: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <path d="M32 4L12 40C12 52 20 60 32 60C44 60 52 52 52 40L32 4Z" fillOpacity="0.9"/>
      <path d="M32 8V56" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 28L22 34" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 40L42 46" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <path d="M32 58C32 58 8 40 8 24C8 14 16 8 24 8C28 8 32 12 32 12C32 12 36 8 40 8C48 8 56 14 56 24C56 40 32 58 32 58Z" fillOpacity="0.9"/>
      <path d="M32 16V54" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
    </svg>
  ),
  maple: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <path d="M32 4L28 16L16 12L24 24L8 28L24 32L16 44L28 40L32 60L36 40L48 44L40 32L56 28L40 24L48 12L36 16L32 4Z" fillOpacity="0.9"/>
      <path d="M32 8V56" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
    </svg>
  ),
  ginkgo: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <path d="M32 56V36C32 36 8 32 8 16C8 8 16 4 24 8C28 10 32 16 32 16C32 16 36 10 40 8C48 4 56 8 56 16C56 32 32 36 32 36" fillOpacity="0.9"/>
      <path d="M32 56V20" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
    </svg>
  ),
  fern: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <path d="M32 4C24 8 20 20 20 36C20 52 26 60 32 60C38 60 44 52 44 36C44 20 40 8 32 4Z" fillOpacity="0.9"/>
      <path d="M32 8V56" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 20L24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 28L40 32" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 36L24 40" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 44L40 48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  clover: (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
      <circle cx="32" cy="18" r="12" fillOpacity="0.9"/>
      <circle cx="20" cy="34" r="12" fillOpacity="0.9"/>
      <circle cx="44" cy="34" r="12" fillOpacity="0.9"/>
      <path d="M32 30V58" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.6" strokeLinecap="round"/>
    </svg>
  ),
};

const GradientColors = [
  { gradient: 'from-amber-400 to-orange-500', leafColor: 'text-amber-100' },
  { gradient: 'from-emerald-400 to-cyan-600', leafColor: 'text-emerald-100' },
  { gradient: 'from-cyan-400 to-blue-500', leafColor: 'text-cyan-100' },
  { gradient: 'from-cyan-400 to-cyan-600', leafColor: 'text-cyan-100' },
  { gradient: 'from-pink-400 to-rose-500', leafColor: 'text-pink-100' },
  { gradient: 'from-lime-400 to-green-600', leafColor: 'text-lime-100' },
  { gradient: 'from-red-400 to-rose-600', leafColor: 'text-red-100' },
  { gradient: 'from-sky-400 to-indigo-500', leafColor: 'text-sky-100' },
];

const LeafTypes = Object.keys(LeafDesigns) as (keyof typeof LeafDesigns)[];

// Better hash function that produces more unique values
const hashString = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
};

const getLeafData = (courseId: string) => {
  // Use different salts to ensure different leaf/color combinations
  const colorHash = hashString(courseId + '_color');
  const leafHash = hashString(courseId + '_leaf');
  return {
    colorIndex: colorHash % GradientColors.length,
    leafIndex: leafHash % LeafTypes.length,
  };
};

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  progress?: {
    total_stages: number;
    completed_stages: number;
    progress_percentage: number;
  } | null;
}

export const CourseCard = ({ course, onEdit, progress }: CourseCardProps) => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const courseSlug = slugify(course.title);

  // Prefetch course detail data on hover for instant navigation
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['course-with-stages', courseSlug],
      queryFn: async () => {
        const { data: courseDetail, error } = await supabase
          .from('courses')
          .select(`
            id, title, description, company, attached_jobs, created_at,
            course_stages ( id, title, description, information, stage_order )
          `)
          .eq('slug', courseSlug)
          .order('stage_order', { referencedTable: 'course_stages' })
          .maybeSingle();
        if (error) throw error;
        if (!courseDetail) throw new Error('Course not found');
        const stages = (courseDetail.course_stages || []).sort(
          (a: any, b: any) => a.stage_order - b.stage_order
        );
        const { course_stages, ...rest } = courseDetail;
        return { course: rest, stages };
      },
      staleTime: 5 * 60 * 1000,
    });
  };

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

  const leafData = getLeafData(course.id);
  const colorScheme = GradientColors[leafData.colorIndex];
  const leafType = LeafTypes[leafData.leafIndex];
  const LeafSvg = LeafDesigns[leafType];

  return (
    <div 
      className="bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group h-full flex flex-col"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* Leaf Image Header */}
      <div className={`w-full h-36 bg-gradient-to-br ${colorScheme.gradient} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/5"></div>
        <div className={colorScheme.leafColor}>
          {LeafSvg}
        </div>
        {/* Admin Menu */}
        {isAdmin && (
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/20 hover:bg-white/40 text-white"
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

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Company Tag */}
        {course.company && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            {course.company}
          </span>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mt-2 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {course.description}
          </p>
        )}

        {/* Progress badge for non-admin users */}
        {!isAdmin && progress && progress.progress_percentage > 0 && (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs w-fit mb-3"
          >
            {progress.progress_percentage}% Complete
          </Badge>
        )}

        {/* Start Learning Button */}
        <div className="flex items-center justify-end pt-2 border-t border-neutral-800 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-primary font-medium p-0 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Start Learning
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
