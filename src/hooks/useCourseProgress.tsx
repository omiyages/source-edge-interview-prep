// ABOUTME: Hook to fetch course progress data for candidates on assigned courses
// ABOUTME: Used in admin dashboard to track user progress across their assigned courses

import { useQuery } from '@tanstack/react-query';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';

interface CourseProgressData {
  user_id: string;
  user_name: string;
  user_email: string;
  course_id: string;
  course_title: string;
  assigned_at: string;
  total_stages: number;
  completed_stages: number;
  progress_percentage: number;
  last_activity: string | null;
}

export const useCourseProgress = () => {
  const { client, isReady, hasClerkJwt } = useClerkSupabase();

  const { data: progressData, isLoading, error, refetch } = useQuery({
    queryKey: ['course-progress'],
    enabled: isReady && hasClerkJwt,
    queryFn: async () => {
      // Get course assignments with user and course details
      const { data: assignments, error: assignmentError } = await client
        .from('course_assignments')
        .select(`
          user_id,
          course_id,
          assigned_at
        `);

      if (assignmentError) {
        throw assignmentError;
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Get user details separately
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: users, error: usersError } = await client
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (usersError) {
        throw usersError;
      }

      // Get course details separately
      const courseIds = [...new Set(assignments.map(a => a.course_id))];
      const { data: courses, error: coursesError } = await client
        .from('courses')
        .select('id, title')
        .in('id', courseIds);
      if (coursesError) {
        throw coursesError;
      }

      // Get course stages count for each course
      const { data: stagesData, error: stagesError } = await client
        .from('course_stages')
        .select('course_id, id')
        .in('course_id', courseIds);

      if (stagesError) {
        throw stagesError;
      }

      // Get user progress
      const { data: progressData, error: progressError } = await client
        .from('user_progress')
        .select('user_id, course_id, stage_id, completed_at')
        .in('user_id', userIds)
        .in('course_id', courseIds);

      if (progressError) {
        throw progressError;
      }

      // Calculate progress for each assignment
      const result: CourseProgressData[] = assignments.map(assignment => {
        const user = users?.find(u => u.id === assignment.user_id);
        const course = courses?.find(c => c.id === assignment.course_id);
        
        const totalStages = stagesData?.filter(s => s.course_id === assignment.course_id).length || 0;
        const completedStages = progressData?.filter(p => 
          p.user_id === assignment.user_id && 
          p.course_id === assignment.course_id
        ).length || 0;
        
        const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
        
        // Get last activity
        const userProgress = progressData?.filter(p => 
          p.user_id === assignment.user_id && 
          p.course_id === assignment.course_id
        );
        const lastActivity = userProgress && userProgress.length > 0 
          ? userProgress.reduce((latest, current) => 
              new Date(current.completed_at) > new Date(latest.completed_at) ? current : latest
            ).completed_at
          : null;

        return {
          user_id: assignment.user_id,
          user_name: user?.full_name || 'Unknown',
          user_email: user?.email || 'Unknown',
          course_id: assignment.course_id,
          course_title: course?.title || 'Unknown Course',
          assigned_at: assignment.assigned_at,
          total_stages: totalStages,
          completed_stages: completedStages,
          progress_percentage: progressPercentage,
          last_activity: lastActivity
        };
      });

      return result;
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  return {
    progressData: progressData || [],
    isLoading,
    error,
    refetch
  };
};