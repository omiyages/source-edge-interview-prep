// ABOUTME: Hook for managing question bookmark/save functionality
// ABOUTME: Handles adding/removing bookmarks using the question_likes table

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface BookmarkInfo {
  isBookmarked: boolean;
}

/**
 * Hook to manage bookmark for a specific question
 */
export const useQuestionBookmark = (questionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's bookmark status
  const { data: bookmarkInfo, isLoading } = useQuery<BookmarkInfo>({
    queryKey: ['question-bookmark', questionId, user?.id],
    queryFn: async () => {
      if (!questionId || !user?.id) {
        return { isBookmarked: false };
      }

      const { data, error } = await supabase
        .from('question_likes')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking bookmark status:', error);
        return { isBookmarked: false };
      }

      return { isBookmarked: !!data };
    },
    enabled: !!questionId && !!user?.id,
    staleTime: 30000,
  });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('You must be logged in to save questions');
      }

      if (!bookmarkInfo?.isBookmarked) {
        // Add bookmark
        const { error } = await supabase
          .from('question_likes')
          .insert({
            question_id: questionId,
            user_id: user.id,
          });

        if (error) {
          throw error;
        }
      } else {
        // Remove bookmark
        const { error } = await supabase
          .from('question_likes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Invalidate and refetch bookmark info
      queryClient.invalidateQueries({ queryKey: ['question-bookmark', questionId] });
      queryClient.invalidateQueries({ queryKey: ['saved-questions'] });
      
      toast({
        title: bookmarkInfo?.isBookmarked ? "Question unsaved" : "Question saved",
        description: bookmarkInfo?.isBookmarked 
          ? "Removed from your saved questions." 
          : "Added to your saved questions!",
      });
    },
    onError: (error: any) => {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save question. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    isBookmarked: bookmarkInfo?.isBookmarked || false,
    isLoading,
    toggleBookmark: toggleBookmarkMutation.mutate,
    isToggling: toggleBookmarkMutation.isPending,
  };
};

/**
 * Hook to get bookmark status for multiple questions
 */
export const useQuestionsBookmarks = (questionIds: string[]) => {
  const { user } = useAuth();

  return useQuery<Record<string, boolean>>({
    queryKey: ['questions-bookmarks', questionIds, user?.id],
    queryFn: async () => {
      if (questionIds.length === 0 || !user?.id) {
        return {};
      }

      const { data, error } = await supabase
        .from('question_likes')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds);

      if (error) {
        console.error('Error fetching bookmarks:', error);
        return {};
      }

      const result: Record<string, boolean> = {};
      questionIds.forEach((id) => {
        result[id] = data?.some((b) => b.question_id === id) || false;
      });

      return result;
    },
    enabled: questionIds.length > 0 && !!user?.id,
    staleTime: 30000,
  });
};
