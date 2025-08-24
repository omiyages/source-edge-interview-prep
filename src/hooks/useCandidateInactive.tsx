
// ABOUTME: Hook for toggling candidate active/inactive status
// ABOUTME: Handles updating candidate status with proper permissions

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCandidateInactive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleCandidateStatus = useMutation({
    mutationFn: async ({ candidateId, isActive }: { candidateId: string; isActive: boolean }) => {
      console.log('🔄 Toggling candidate status:', { candidateId, isActive });
      
      // Update candidate record
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({ is_active: isActive } as any)
        .eq('id', candidateId);

      if (candidateError) {
        console.error('❌ Error updating candidate status:', candidateError);
        throw candidateError;
      }

      console.log('✅ Successfully updated candidate status');
      return { candidateId, isActive };
    },
    onSuccess: ({ candidateId, isActive }) => {
      console.log('🎉 Mutation successful, invalidating queries');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      
      toast({
        title: "Success",
        description: `Candidate ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Mutation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update candidate status",
        variant: "destructive",
      });
    },
  });

  return {
    toggleCandidateStatus: toggleCandidateStatus.mutate,
    isLoading: toggleCandidateStatus.isPending,
  };
};
