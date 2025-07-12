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
  stage_id?: string;
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
            stage_id
          )
        `)
        .eq('role', 'user');
      
      if (error) throw error;
      
      return data.map(candidate => ({
        ...candidate,
        stage_id: candidate.candidate_pipeline?.[0]?.stage_id || null,
      })) as Candidate[];
    },
  });

  const moveCandidateMutation = useMutation({
    mutationFn: async ({ candidateId, stageId }: { candidateId: string; stageId: string }) => {
      const { error } = await supabase
        .from('candidate_pipeline')
        .upsert({
          candidate_id: candidateId,
          stage_id: stageId,
        }, {
          onConflict: 'candidate_id'
        });

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
    const candidate = candidates.find(c => c.id === event.active.id);
    setActiveCandidate(candidate || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) return;

    const candidateId = active.id as string;
    const newStageId = over.id as string;

    // Find current stage
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.stage_id === newStageId) return;

    moveCandidateMutation.mutate({ candidateId, stageId: newStageId });
  };

  const getCandidatesForStage = (stageId: string) => {
    return candidates.filter(candidate => candidate.stage_id === stageId);
  };

  const getUnassignedCandidates = () => {
    return candidates.filter(candidate => !candidate.stage_id);
  };

  const addCandidateToPipelineMutation = useMutation({
    mutationFn: async ({ candidateId, stageId }: { candidateId: string; stageId: string }) => {
      const { error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: stageId,
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

  const handleSelectCandidate = (candidate: Candidate) => {
    // Add to the first stage (or unassigned if no stages)
    const firstStage = stages[0];
    if (firstStage) {
      addCandidateToPipelineMutation.mutate({
        candidateId: candidate.id,
        stageId: firstStage.id,
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