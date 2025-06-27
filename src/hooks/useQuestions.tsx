
import { useState, useEffect } from 'react';
import { fetchQuestions, InterviewQuestion } from '@/services/questionsService';
import { useToast } from '@/hooks/use-toast';

export const useQuestions = (isAdmin: boolean, shouldFetch: boolean = true) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadQuestions = async () => {
    if (!shouldFetch) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchQuestions(isAdmin);
      setQuestions(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load questions';
      console.error('❌ Hook error loading questions:', error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [isAdmin, shouldFetch]);

  return {
    questions,
    loading,
    error,
    refetch: loadQuestions
  };
};
