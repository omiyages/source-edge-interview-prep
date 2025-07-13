
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Candidate, HiringStage } from './useKanbanData';

export const useMoveCandidateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId, stageId }: { applicationId: string; stageId: string }) => {
      console.log('🔄 Moving candidate:', { applicationId, stageId });
      const { error } = await supabase
        .from('candidate_pipeline')
        .update({ stage_id: stageId, moved_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) {
        console.error('❌ Error moving candidate:', error);
        throw error;
      }
      console.log('✅ Candidate moved successfully');
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
      console.log('🔄 Adding candidate to pipeline:', { candidateId, stageId, appliedCompany, appliedJobTitle });
      
      const { data, error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: stageId,
          applied_company: appliedCompany,
          applied_job_title: appliedJobTitle,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding candidate to pipeline:', error);
        throw error;
      }
      
      console.log('✅ Candidate added to pipeline:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Pipeline addition successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate added to pipeline');
    },
    onError: (error) => {
      console.error('❌ Pipeline addition failed:', error);
      toast.error('Failed to add candidate to pipeline');
    },
  });
};

export const useKanbanActions = (stages: HiringStage[]) => {
  const addCandidateToPipelineMutation = useAddCandidateToPipelineMutation();

  const handleSelectCandidate = (candidate: Candidate, appliedCompany?: string, appliedJobTitle?: string) => {
    console.log('🎯 Handling candidate selection:', { 
      candidateId: candidate.id, 
      candidateEmail: candidate.email,
      appliedCompany, 
      appliedJobTitle,
      availableStages: stages.length 
    });
    
    // Add to the first stage (or unassigned if no stages)
    const firstStage = stages[0];
    if (firstStage) {
      console.log('📍 Adding to first stage:', firstStage.name);
      addCandidateToPipelineMutation.mutate({
        candidateId: candidate.id,
        stageId: firstStage.id,
        appliedCompany,
        appliedJobTitle,
      });
    } else {
      console.error('❌ No hiring stages available');
      toast.error('No hiring stages configured');
    }
  };

  return {
    handleSelectCandidate,
  };
};
