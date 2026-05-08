// Hook to check if a course is assigned to the current user
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clerkSupabaseClient } from '@/lib/clerk';
import { useAuth } from './useAuth';

export const useCourseAssignment = (courseId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isAssigned, isLoading } = useQuery({
    queryKey: ['course-assignment', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return false;

      const { data, error } = await clerkSupabaseClient
        .from('course_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!courseId,
  });

  const startCourseMutation = useMutation({
    mutationFn: async () => {
      if (!user || !courseId) throw new Error("User or course ID missing");

      const { error } = await clerkSupabaseClient
        .from("course_assignments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          assigned_by: user.id,
        });

      // If the assignment already exists, that's fine (unique(user_id, course_id)).
      if (error) {
        const isConflict =
          (error as any)?.code === "23505" || (error as any)?.status === 409;
        if (!isConflict) {
          console.error("Error starting course:", error);
          throw error;
        }
      }
      
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate all related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['course-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-courses-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-assigned-courses'] });
    },
  });

  return {
    isAssigned: isAssigned ?? false,
    isLoading,
    startCourse: async () => {
      await startCourseMutation.mutateAsync();
    },
    isStarting: startCourseMutation.isPending,
    error: startCourseMutation.error,
  };
};

