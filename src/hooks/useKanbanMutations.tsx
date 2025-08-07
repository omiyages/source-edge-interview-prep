
// ABOUTME: Hook for managing Kanban board mutations with optimistic updates
// ABOUTME: Handles candidate movement, deletion, and pipeline operations with real-time UI feedback

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
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate moved successfully');
    },
    onError: (error) => {
      toast.error('Failed to move candidate');
      console.error('Error moving candidate:', error);
    },
  });
};

export const useAddCandidateToStageMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, stageId }: { candidateId: string; stageId: string }) => {
      console.log('🔄 Adding candidate to stage:', { candidateId, stageId });
      
      const { data, error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: stageId,
          is_active: true,
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
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate moved to stage successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to add candidate to stage:', error);
      toast.error('Failed to move candidate to stage');
    },
  });
};

export const useDeleteCandidateCompletely = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId }: { candidateId: string }) => {
      console.log('🗑️ Deleting candidate completely:', { candidateId });
      
      // First remove from pipeline if exists
      const { error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .delete()
        .eq('candidate_id', candidateId);

      if (pipelineError) {
        console.error('❌ Error removing candidate from pipeline:', pipelineError);
      }

      // Then delete the candidate
      const { error: candidateError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (candidateError) {
        console.error('❌ Error deleting candidate:', candidateError);
        throw candidateError;
      }
      
      console.log('✅ Candidate deleted completely');
    },
    onMutate: async ({ candidateId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['candidates-pipeline'] });

      // Snapshot the previous value
      const previousCandidates = queryClient.getQueryData(['candidates-pipeline']);

      // Optimistically remove the candidate from the cache
      queryClient.setQueryData(['candidates-pipeline'], (old: any) => {
        if (!old) return [];
        return old.filter((candidate: any) => candidate.id !== candidateId);
      });

      // Return a context object with the snapshotted value
      return { previousCandidates };
    },
    onError: (err, { candidateId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCandidates) {
        queryClient.setQueryData(['candidates-pipeline'], context.previousCandidates);
      }
      toast.error('Failed to delete candidate');
      console.error('❌ Failed to delete candidate:', err);
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate deleted completely');
    },
  });
};

export const useAddCandidateToPipelineMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, appliedCompany, appliedJobTitle, stageId }: { 
      candidateId: string; 
      appliedCompany?: string; 
      appliedJobTitle?: string;
      stageId?: string;
    }) => {
      console.log('🔄 Adding candidate to pipeline:', { candidateId, appliedCompany, appliedJobTitle, stageId });
      
      // If no stageId is provided, get the first hiring stage
      let targetStageId = stageId;
      
      if (!targetStageId) {
        const { data: stages, error: stagesError } = await supabase
          .from('hiring_stages')
          .select('id')
          .order('order_index')
          .limit(1);
        
        if (stagesError || !stages || stages.length === 0) {
          console.error('❌ Error fetching hiring stages:', stagesError);
          throw new Error('No hiring stages found');
        }
        
        targetStageId = stages[0].id;
      }
      
      const { data, error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: targetStageId,
          applied_company: appliedCompany,
          applied_job_title: appliedJobTitle,
          is_active: true,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
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
    console.log('🎯 Handling candidate selection from search dialog:', { 
      candidateId: candidate.id, 
      candidateName: candidate.full_name,
      appliedCompany, 
      appliedJobTitle 
    });
    
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
