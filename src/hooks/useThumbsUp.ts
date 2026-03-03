// ABOUTME: Hook for managing question thumbs up/likes functionality
// ABOUTME: Handles adding/removing thumbs up and fetching thumbs up counts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ThumbsUpData {
  question_id: string;
  user_id: string;
  created_at: string;
}

interface QuestionThumbsUpInfo {
  count: number;
  hasThumbsUp: boolean;
}

/**
 * Hook to manage thumbs up for a specific question
 */
export const useQuestionThumbsUp = (questionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch thumbs up count and user's thumbs up status
  const { data: thumbsUpInfo, isLoading } = useQuery<QuestionThumbsUpInfo>({
    queryKey: ['question-thumbs-up', questionId, user?.id],
    queryFn: async () => {
      if (!questionId) {
        return { count: 0, hasThumbsUp: false };
      }

      // Get count
      const { count, error: countError } = await supabase
        .from('question_thumbs_up')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);

      if (countError) {
        console.error('Error fetching thumbs up count:', countError);
        return { count: 0, hasThumbsUp: false };
      }

      // Check if current user has thumbs up
      let hasThumbsUp = false;
      if (user?.id) {
        const { data, error: checkError } = await supabase
          .from('question_thumbs_up')
          .select('id')
          .eq('question_id', questionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!checkError && data) {
          hasThumbsUp = true;
        }
      }

      return {
        count: count || 0,
        hasThumbsUp,
      };
    },
    enabled: !!questionId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Toggle thumbs up mutation
  const toggleThumbsUpMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('You must be logged in to thumbs up questions');
      }

      if (!thumbsUpInfo?.hasThumbsUp) {
        // Add thumbs up
        const { error } = await supabase
          .from('question_thumbs_up')
          .insert({
            question_id: questionId,
            user_id: user.id,
          });

        if (error) {
          throw error;
        }
      } else {
        // Remove thumbs up
        const { error } = await supabase
          .from('question_thumbs_up')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Invalidate and refetch thumbs up info
      queryClient.invalidateQueries({ queryKey: ['question-thumbs-up', questionId] });
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      
      toast({
        title: thumbsUpInfo?.hasThumbsUp ? "Thumbs up removed" : "Thumbs up added",
        description: thumbsUpInfo?.hasThumbsUp 
          ? "Your thumbs up has been removed." 
          : "Thanks for your feedback!",
      });
    },
    onError: (error: any) => {
      console.error('Error toggling thumbs up:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update thumbs up. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    count: thumbsUpInfo?.count || 0,
    hasThumbsUp: thumbsUpInfo?.hasThumbsUp || false,
    isLoading,
    toggleThumbsUp: toggleThumbsUpMutation.mutate,
    isToggling: toggleThumbsUpMutation.isPending,
  };
};

export const useQuestionThumbsUpWithOptions = (
  questionId: string,
  options?: { enabled?: boolean }
) => {
  const enabled = options?.enabled ?? true;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: thumbsUpInfo, isLoading } = useQuery<QuestionThumbsUpInfo>({
    queryKey: ['question-thumbs-up', questionId, user?.id],
    queryFn: async () => {
      if (!questionId) {
        return { count: 0, hasThumbsUp: false };
      }

      const { count, error: countError } = await supabase
        .from('question_thumbs_up')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);

      if (countError) return { count: 0, hasThumbsUp: false };

      let hasThumbsUp = false;
      if (user?.id) {
        const { data } = await supabase
          .from('question_thumbs_up')
          .select('id')
          .eq('question_id', questionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) hasThumbsUp = true;
      }

      return { count: count || 0, hasThumbsUp };
    },
    enabled: enabled && !!questionId,
    staleTime: 30000,
  });

  const toggleThumbsUpMutation = useMutation({
    mutationFn: async () => {
      if (!enabled) return;
      if (!user?.id) throw new Error('You must be logged in to thumbs up questions');

      if (!thumbsUpInfo?.hasThumbsUp) {
        const { error } = await supabase
          .from('question_thumbs_up')
          .insert({ question_id: questionId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_thumbs_up')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-thumbs-up', questionId] });
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      if (!enabled) return;
      toast({
        title: thumbsUpInfo?.hasThumbsUp ? "Thumbs up removed" : "Thumbs up added",
        description: thumbsUpInfo?.hasThumbsUp
          ? "Your thumbs up has been removed."
          : "Thanks for your feedback!",
      });
    },
    onError: (error: any) => {
      if (!enabled) return;
      toast({
        title: "Error",
        description: error.message || "Failed to update thumbs up. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    count: thumbsUpInfo?.count || 0,
    hasThumbsUp: thumbsUpInfo?.hasThumbsUp || false,
    isLoading,
    toggleThumbsUp: toggleThumbsUpMutation.mutate,
    isToggling: toggleThumbsUpMutation.isPending,
  };
};

/**
 * Hook to get thumbs up counts for multiple questions
 */
export const useQuestionsThumbsUp = (questionIds: string[]) => {
  const { user } = useAuth();

  return useQuery<Record<string, QuestionThumbsUpInfo>>({
    queryKey: ['questions-thumbs-up', questionIds, user?.id],
    queryFn: async () => {
      if (questionIds.length === 0) {
        return {};
      }

      // Get all thumbs up for these questions
      const { data: thumbsUpData, error } = await supabase
        .from('question_thumbs_up')
        .select('question_id, user_id')
        .in('question_id', questionIds);

      if (error) {
        console.error('Error fetching thumbs up data:', error);
        return {};
      }

      // Group by question_id and count
      const result: Record<string, QuestionThumbsUpInfo> = {};
      
      questionIds.forEach((id) => {
        const questionThumbsUp = thumbsUpData?.filter((t) => t.question_id === id) || [];
        result[id] = {
          count: questionThumbsUp.length,
          hasThumbsUp: user?.id ? questionThumbsUp.some((t) => t.user_id === user.id) : false,
        };
      });

      return result;
    },
    enabled: questionIds.length > 0,
    staleTime: 30000,
  });
};



