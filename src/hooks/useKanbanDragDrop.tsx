
import { useState } from 'react';
import { DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { toast } from 'sonner';
import { Candidate } from './useKanbanData';
import { useMoveCandidateMutation, useAddUnassignedCandidateToStageMutation, useRemoveCandidateFromPipelineMutation } from './useKanbanMutations';

export const useKanbanDragDrop = (candidates: Candidate[]) => {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const moveCandidateMutation = useMoveCandidateMutation();
  const addUnassignedCandidateToStageMutation = useAddUnassignedCandidateToStageMutation();
  const removeCandidateFromPipelineMutation = useRemoveCandidateFromPipelineMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🎯 Drag started with ID:', event.active.id);
    const applicationId = event.active.id as string;
    
    // Find the candidate by searching through all applications
    for (const candidate of candidates) {
      const application = candidate.applications?.find(app => app.id === applicationId);
      if (application) {
        console.log('🎯 Found candidate for drag:', candidate.email);
        setActiveCandidate(candidate);
        return;
      }
    }
    
    // If not found in applications, check if it's an unassigned candidate
    const unassignedCandidate = candidates.find(c => c.id === applicationId);
    if (unassignedCandidate) {
      console.log('🎯 Found unassigned candidate for drag:', unassignedCandidate.email);
      setActiveCandidate(unassignedCandidate);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) {
      console.log('❌ No drop target');
      return;
    }

    const draggedId = active.id as string;
    const newStageId = over.id as string;

    console.log('🎯 Drop event:', { draggedId, newStageId });

    // Check if this is an unassigned candidate (no application)
    const unassignedCandidate = candidates.find(c => c.id === draggedId && (!c.applications || c.applications.length === 0));
    
    if (unassignedCandidate && newStageId !== 'unassigned') {
      console.log('🔄 Moving unassigned candidate to stage:', newStageId);
      addUnassignedCandidateToStageMutation.mutate({ 
        candidateId: unassignedCandidate.id, 
        stageId: newStageId 
      });
      return;
    }

    // Handle moving TO unassigned (remove from pipeline)
    if (newStageId === 'unassigned') {
      let applicationId = null;
      
      for (const candidate of candidates) {
        const application = candidate.applications?.find(app => app.id === draggedId);
        if (application) {
          applicationId = application.id;
          break;
        }
      }

      if (applicationId) {
        console.log('🔄 Moving candidate to unassigned (removing from pipeline):', applicationId);
        removeCandidateFromPipelineMutation.mutate({ applicationId });
        return;
      }
    }

    // Handle moving from one stage to another (existing application)
    let applicationId = null;
    let currentStageId = null;

    for (const candidate of candidates) {
      const application = candidate.applications?.find(app => app.id === draggedId);
      if (application) {
        applicationId = application.id;
        currentStageId = application.stage_id;
        break;
      }
    }

    if (!applicationId || !currentStageId) {
      console.error('❌ Could not find application for drag ID:', draggedId);
      return;
    }

    if (currentStageId === newStageId) {
      console.log('🔄 Same stage, no move needed');
      return;
    }

    console.log('🔄 Moving application:', { applicationId, from: currentStageId, to: newStageId });
    moveCandidateMutation.mutate({ applicationId, stageId: newStageId });
  };

  return {
    sensors,
    activeCandidate,
    handleDragStart,
    handleDragEnd,
  };
};
