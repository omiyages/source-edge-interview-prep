
// ABOUTME: Custom hook for fetching and managing course data with optional limiting
// ABOUTME: Provides course data, loading states, and error handling for course lists

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export const useCourses = (enabled: boolean = true, limit?: number) => {
  const { data: courses = [], isLoading: loading, error } = useQuery({
    queryKey: ['courses', limit],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled,
  });

  return { courses, loading, error };
};
