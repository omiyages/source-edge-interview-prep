
// ABOUTME: Custom hooks for managing candidate active/inactive status in the pipeline
// ABOUTME: Handles toggling candidate visibility and status updates

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMakeCandidateInactive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      console.log('🔄 Making candidate inactive:', { applicationId });
      
      const { error } = await supabase
        .from('candidate_pipeline')
        .update({ is_active: false })
        .eq('id', applicationId);

      if (error) {
        console.error('❌ Error making candidate inactive:', error);
        throw error;
      }
      
      console.log('✅ Candidate made inactive successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate marked as inactive');
    },
    onError: (error) => {
      console.error('❌ Failed to make candidate inactive:', error);
      toast.error('Failed to mark candidate as inactive');
    },
  });
};

export const useToggleCandidateStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, isActive }: { candidateId: string; isActive: boolean }) => {
      console.log('🔄 Toggling candidate status:', { candidateId, isActive });
      
      // Update both candidate and pipeline records
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({ is_active: isActive })
        .eq('id', candidateId);

      if (candidateError) {
        console.error('❌ Error updating candidate status:', candidateError);
        throw candidateError;
      }

      const { error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .update({ is_active: isActive })
        .eq('candidate_id', candidateId);

      if (pipelineError) {
        console.error('❌ Error updating pipeline status:', pipelineError);
        throw pipelineError;
      }
      
      console.log('✅ Candidate status toggled successfully');
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success(`Candidate marked as ${isActive ? 'active' : 'inactive'}`);
    },
    onError: (error) => {
      console.error('❌ Failed to toggle candidate status:', error);
      toast.error('Failed to update candidate status');
    },
  });
};
