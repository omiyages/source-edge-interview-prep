import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumn } from './KanbanColumn';
import { CandidateCard } from './CandidateCard';
import { CandidateSearchDialog } from './CandidateSearchDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface HiringStage {
  id: string;
  name: string;
  stage_order: number;
  color: string;
}

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
  applications?: CandidateApplication[];
}

interface CandidateApplication {
  id: string;
  stage_id: string;
  applied_company: string | null;
  applied_job_title: string | null;
  created_at: string;
}

export const KanbanBoard = () => {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: stages = [] } = useQuery({
    queryKey: ['hiring-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hiring_stages')
        .select('*')
        .order('stage_order');
      
      if (error) throw error;
      return data as HiringStage[];
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates-with-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          candidate_pipeline (
            id,
            stage_id,
            applied_company,
            applied_job_title,
            created_at
          )
        `)
        .eq('role', 'user');
      
      if (error) throw error;
      
      return data.map(candidate => ({
        ...candidate,
        applications: candidate.candidate_pipeline || [],
      })) as Candidate[];
    },
  });

  const moveCandidateMutation = useMutation({
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

  const handleDragStart = (event: DragStartEvent) => {
    // The active.id is now the applicationId, find the candidate by application
    const applicationId = event.active.id as string;
    for (const candidate of candidates) {
      const application = candidate.applications?.find(app => app.id === applicationId);
      if (application) {
        setActiveCandidate(candidate);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) return;

    const applicationId = active.id as string;
    const newStageId = over.id as string;

    // Find the application and current stage
    let currentStageId = null;
    for (const candidate of candidates) {
      const application = candidate.applications?.find(app => app.id === applicationId);
      if (application) {
        currentStageId = application.stage_id;
        break;
      }
    }

    if (!currentStageId || currentStageId === newStageId) return;

    moveCandidateMutation.mutate({ applicationId, stageId: newStageId });
  };

  const getCandidatesForStage = (stageId: string) => {
    const applications: any[] = [];
    candidates.forEach(candidate => {
      candidate.applications?.forEach(application => {
        if (application.stage_id === stageId) {
          applications.push({
            ...candidate,
            applicationId: application.id,
            applied_company: application.applied_company,
            applied_job_title: application.applied_job_title,
            application_created_at: application.created_at,
          });
        }
      });
    });
    return applications;
  };

  const getUnassignedCandidates = () => {
    return candidates.filter(candidate => !candidate.applications || candidate.applications.length === 0);
  };

  const addCandidateToPipelineMutation = useMutation({
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

  return (
    <div className="h-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Candidate Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Drag candidates between stages or add new candidates to the pipeline
          </p>
        </div>
        <Button onClick={() => setShowSearchDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto h-full pb-4">
          {/* Unassigned candidates column */}
          <KanbanColumn
            id="unassigned"
            title="Unassigned"
            color="#64748b"
            candidates={getUnassignedCandidates()}
          />
          
          {/* Stage columns */}
          {stages.map(stage => (
            <KanbanColumn
              key={stage.id}
              id={stage.id}
              title={stage.name}
              color={stage.color}
              candidates={getCandidatesForStage(stage.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <CandidateCard
              candidate={activeCandidate}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CandidateSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSelectCandidate={handleSelectCandidate}
      />
    </div>
  );
};