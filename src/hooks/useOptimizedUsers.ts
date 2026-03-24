
// ABOUTME: Optimized users query hook with better caching and performance
// ABOUTME: Provides efficient user data fetching for admin components

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clerkSupabaseClient } from '@/lib/clerk';
import { UserProfile } from '@/types/user';

export const useOptimizedUsers = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('📥 Fetching users for admin...');
      const { data, error } = await clerkSupabaseClient
        .from('profiles')
        .select('id, email, full_name, role, is_active, last_login_at, total_session_time_minutes, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
      
      console.log('✅ Users loaded:', data?.length || 0);
      return data as UserProfile[];
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const refetchUsers = () => {
    return query.refetch();
  };

  return {
    ...query,
    invalidateUsers,
    refetchUsers,
  };
};
