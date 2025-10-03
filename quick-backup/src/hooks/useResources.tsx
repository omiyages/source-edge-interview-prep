
import { useQuery } from '@tanstack/react-query';
import { fetchResources } from '@/services/resourcesService';

export const useResources = (shouldFetch: boolean = true, limit: number = 10) => {
  const { data: resources = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['resources', limit],
    queryFn: () => fetchResources(limit),
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    resources,
    loading,
    error: error?.message || null,
    refetch,
  };
};
