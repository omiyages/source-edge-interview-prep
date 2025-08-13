
// ABOUTME: Hook for toggling candidate active/inactive status in the pipeline
// ABOUTME: Handles updating both candidates and candidate_pipeline tables

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCandidateInactive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleCandidateStatus = useMutation({
    mutationFn: async ({ candidateId, isActive }: { candidateId: string; isActive: boolean }) => {
      console.log('🔄 Toggling candidate status:', { candidateId, isActive });
      
      // Update candidate record - use type assertion to handle is_active
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({ is_active: isActive } as any)
        .eq('id', candidateId);

      if (candidateError) {
        console.error('❌ Error updating candidate status:', candidateError);
        throw candidateError;
      }

      // Update pipeline records
      const { error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .update({ is_active: isActive })
        .eq('candidate_id', candidateId);

      if (pipelineError) {
        console.error('❌ Error updating pipeline status:', pipelineError);
        throw pipelineError;
      }

      console.log('✅ Successfully updated candidate status');
      return { candidateId, isActive };
    },
    onSuccess: ({ candidateId, isActive }) => {
      console.log('🎉 Mutation successful, invalidating queries');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      
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
