
import { useQuery } from '@tanstack/react-query';
import { fetchQuestions, InterviewQuestion } from '@/services/questionsService';
import { useToast } from '@/hooks/use-toast';

export const useQuestions = (isAdmin: boolean, shouldFetch: boolean = true) => {
  const { toast } = useToast();

  const {
    data: questions = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['questions', isAdmin],
    queryFn: () => fetchQuestions(isAdmin),
    enabled: shouldFetch,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to load questions';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  return {
    questions,
    loading,
    error: error?.message || null,
    refetch
  };
};
