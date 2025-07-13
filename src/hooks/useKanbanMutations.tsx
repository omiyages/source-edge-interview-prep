import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Candidate, HiringStage } from './useKanbanData';

export const useMoveCandidateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId, stageId }: { applicationId: string; stageId: string }) => {
      const { error } = await supabase
        .from('candidate_pipeline')
        .update({ stage_id: stageId, moved_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      toast.success('Candidate moved successfully');
    },
    onError: (error) => {
      toast.error('Failed to move candidate');
      console.error('Error moving candidate:', error);
    },
  });
};

export const useAddCandidateToPipelineMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, stageId, appliedCompany, appliedJobTitle }: { 
      candidateId: string; 
      stageId: string; 
      appliedCompany?: string; 
      appliedJobTitle?: string; 
    }) => {
      const { error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: stageId,
          applied_company: appliedCompany,
          applied_job_title: appliedJobTitle,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      toast.success('Candidate added to pipeline');
    },
    onError: (error) => {
      toast.error('Failed to add candidate to pipeline');
      console.error('Error adding candidate to pipeline:', error);
    },
  });
};

export const useKanbanActions = (stages: HiringStage[]) => {
  const addCandidateToPipelineMutation = useAddCandidateToPipelineMutation();

  const handleSelectCandidate = (candidate: Candidate, appliedCompany?: string, appliedJobTitle?: string) => {
    // Add to the first stage (or unassigned if no stages)
    const firstStage = stages[0];
    if (firstStage) {
      addCandidateToPipelineMutation.mutate({
        candidateId: candidate.id,
        stageId: firstStage.id,
        appliedCompany,
        appliedJobTitle,
      });
    }
  };

  return {
    handleSelectCandidate,
  };
};