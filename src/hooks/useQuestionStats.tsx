
import { useQuery } from '@tanstack/react-query';
import { fetchQuestionStats } from '@/services/questionsService';
import type { QuestionStats } from '@/services/questionsService';

export const useQuestionStats = (enabled: boolean = true) => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['question-stats'],
    queryFn: fetchQuestionStats,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (stats don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  return {
    stats: data || null,
    loading,
  };
};
