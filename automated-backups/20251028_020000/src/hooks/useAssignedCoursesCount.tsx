// ABOUTME: Hook to fetch the count of assigned courses for the current user
// ABOUTME: Used for displaying notification badges in navigation

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAssignedCoursesCount = () => {
  const { user } = useAuth();

  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['assigned-courses-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('course_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return { count, isLoading };
};