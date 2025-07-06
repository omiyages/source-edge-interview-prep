
import { useQuery } from '@tanstack/react-query';
import { fetchQuestions } from '@/services/questionsService';

export const useQuestions = (isAdmin: boolean = false, shouldFetch: boolean = true) => {
  const { data: questions = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['questions', isAdmin],
    queryFn: () => fetchQuestions(isAdmin),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    questions,
    loading,
    error: error?.message || null,
    refetch,
  };
};
