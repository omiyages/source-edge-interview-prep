
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

export const useAddUnassignedCandidateToStageMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, stageId }: { candidateId: string; stageId: string }) => {
      console.log('🔄 Adding unassigned candidate to stage:', { candidateId, stageId });
      
      const { data, error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: stageId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding candidate to stage:', error);
        throw error;
      }
      
      console.log('✅ Candidate added to stage successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      toast.success('Candidate moved to stage successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to add candidate to stage:', error);
      toast.error('Failed to move candidate to stage');
    },
  });
};

export const useRemoveCandidateFromPipelineMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      console.log('🗑️ Removing candidate from pipeline:', { applicationId });
      const { error } = await supabase
        .from('candidate_pipeline')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('❌ Error removing candidate from pipeline:', error);
        throw error;
      }
      console.log('✅ Candidate removed from pipeline successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate removed from pipeline');
    },
    onError: (error) => {
      console.error('❌ Failed to remove candidate:', error);
      toast.error('Failed to remove candidate from pipeline');
    },
  });
};

export const useAddCandidateToPipelineMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, appliedCompany, appliedJobTitle }: { 
      candidateId: string; 
      appliedCompany?: string; 
      appliedJobTitle?: string; 
    }) => {
      console.log('🔄 Adding candidate to pipeline (Unassigned):', { candidateId, appliedCompany, appliedJobTitle });
      
      // Always add to "unassigned" stage
      const { data, error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: 'unassigned',
          applied_company: appliedCompany,
          applied_job_title: appliedJobTitle,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding candidate to pipeline:', error);
        throw error;
      }
      
      console.log('✅ Candidate added to pipeline (Unassigned):', data);
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
      appliedJobTitle 
    });
    
    // Always add to unassigned by default
    addCandidateToPipelineMutation.mutate({
      candidateId: candidate.id,
      appliedCompany,
      appliedJobTitle,
    });
  };

  return {
    handleSelectCandidate,
  };
};
