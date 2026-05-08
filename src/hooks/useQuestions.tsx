
import { useQuery } from '@tanstack/react-query';
import { fetchQuestions } from '@/services/questionsService';

export const useQuestions = (
  isAdmin: boolean = false,
  shouldFetch: boolean = true,
  limit: number = 36
) => {
  const { data: questions = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['questions', isAdmin, 'homepage', limit],
    queryFn: () => fetchQuestions(isAdmin, 1, limit),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    questions,
    loading,
    error: error?.message || null,
    refetch,
  };
};
