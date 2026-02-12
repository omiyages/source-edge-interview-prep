
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPaginatedQuestions } from '@/services/questionsService';
import type { PaginatedQuestionsParams } from '@/services/questionsService';
import { useEffect } from 'react';

export const usePaginatedQuestions = (
  params: PaginatedQuestionsParams,
  enabled: boolean = true,
) => {
  const queryClient = useQueryClient();

  const queryKey = ['questions-paginated', params];

  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchPaginatedQuestions(params),
    enabled,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    refetchOnWindowFocus: false,
    // Keep previous data while new page loads (prevents flash)
    placeholderData: (previousData: any) => previousData,
  });

  // Prefetch next page in the background
  useEffect(() => {
    if (!enabled || !data) return;

    const totalPages = Math.ceil(data.totalCount / params.limit);
    if (params.page < totalPages) {
      const nextParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['questions-paginated', nextParams],
        queryFn: () => fetchPaginatedQuestions(nextParams),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [enabled, data, params, queryClient]);

  return {
    questions: data?.data || [],
    totalCount: data?.totalCount || 0,
    loading,
    error: error?.message || null,
    refetch,
  };
};
