
import { useQuery } from '@tanstack/react-query';
import { fetchResources, Resource } from '@/services/resourcesService';

export const useResources = (shouldFetch: boolean = true, limit: number = 10) => {
  const {
    data: resources = [],
    isLoading: loading
  } = useQuery({
    queryKey: ['resources', limit],
    queryFn: () => fetchResources(limit),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  return { resources, loading };
};
