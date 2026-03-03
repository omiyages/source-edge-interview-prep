
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPaginatedQuestions, fetchPaginatedQuestionsCount } from '@/services/questionsService';
import type { PaginatedQuestionsParams } from '@/services/questionsService';
import { useEffect } from 'react';

export const usePaginatedQuestions = (
  params: PaginatedQuestionsParams,
  enabled: boolean = true,
) => {
  const queryClient = useQueryClient();

  const pageQueryKey = ['questions-paginated', params];
  const countQueryKey = ['questions-paginated-count', {
    isAdmin: params.isAdmin ?? false,
    search: params.search ?? '',
    company: params.company ?? [],
    category: params.category ?? [],
    role: params.role ?? [],
    stage: params.stage ?? [],
  }];

  const {
    data: questionsData,
    isLoading: questionsLoading,
    error: questionsError,
    refetch: refetchPage,
  } = useQuery({
    queryKey: pageQueryKey,
    queryFn: () => fetchPaginatedQuestions(params),
    enabled,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    refetchOnWindowFocus: false,
    // Keep previous data while new page loads (prevents flash)
    placeholderData: (previousData: any) => previousData,
  });

  const {
    data: totalCount = 0,
    isLoading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useQuery({
    queryKey: countQueryKey,
    queryFn: () =>
      fetchPaginatedQuestionsCount({
        isAdmin: params.isAdmin,
        search: params.search,
        company: params.company,
        category: params.category,
        role: params.role,
        stage: params.stage,
      }),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Prefetch next page in the background
  useEffect(() => {
    if (!enabled || !questionsData || totalCount <= 0) return;

    const totalPages = Math.ceil(totalCount / params.limit);
    if (params.page < totalPages) {
      const nextParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['questions-paginated', nextParams],
        queryFn: () => fetchPaginatedQuestions(nextParams),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [enabled, questionsData, totalCount, params, queryClient]);

  return {
    questions: questionsData || [],
    totalCount,
    loading: questionsLoading || countLoading,
    error: questionsError?.message || countError?.message || null,
    refetch: () => {
      refetchPage();
      refetchCount();
    },
  };
};
