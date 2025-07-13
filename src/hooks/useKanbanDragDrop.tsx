
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
    const dragId = event.active.id as string;
    
    // First, try to find by application ID (for candidates in pipeline)
    for (const candidate of candidates) {
      const application = candidate.applications?.find(app => app.id === dragId);
      if (application) {
        console.log('🎯 Found pipeline candidate for drag:', candidate.email);
        setActiveCandidate({
          ...candidate,
          applicationId: application.id,
          applied_company: application.applied_company,
          applied_job_title: application.applied_job_title,
        });
        return;
      }
    }
    
    // If not found by application ID, try by candidate ID (for unassigned candidates)
    const unassignedCandidate = candidates.find(c => c.id === dragId);
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

    // Determine if this is an unassigned candidate or pipeline candidate
    let isUnassignedCandidate = false;
    let candidateId = null;
    let applicationId = null;
    let currentStageId = null;

    // First check if draggedId matches any application ID (pipeline candidate)
    for (const candidate of candidates) {
      const application = candidate.applications?.find(app => app.id === draggedId);
      if (application) {
        applicationId = application.id;
        currentStageId = application.stage_id;
        candidateId = candidate.id;
        break;
      }
    }

    // If not found as application, check if it's an unassigned candidate
    if (!applicationId) {
      const unassignedCandidate = candidates.find(c => c.id === draggedId);
      if (unassignedCandidate) {
        isUnassignedCandidate = true;
        candidateId = unassignedCandidate.id;
      }
    }

    if (!candidateId) {
      console.error('❌ Could not identify candidate for drag ID:', draggedId);
      return;
    }

    // Handle moving unassigned candidate to a stage
    if (isUnassignedCandidate && newStageId !== 'unassigned') {
      console.log('🔄 Moving unassigned candidate to stage:', { candidateId, newStageId });
      addUnassignedCandidateToStageMutation.mutate({ 
        candidateId, 
        stageId: newStageId 
      });
      return;
    }

    // Handle moving candidate TO unassigned (remove from pipeline)
    if (newStageId === 'unassigned' && applicationId) {
      console.log('🔄 Moving candidate to unassigned (removing from pipeline):', applicationId);
      removeCandidateFromPipelineMutation.mutate({ applicationId });
      return;
    }

    // Handle moving from one stage to another (within pipeline)
    if (applicationId && currentStageId && currentStageId !== newStageId && newStageId !== 'unassigned') {
      console.log('🔄 Moving application between stages:', { applicationId, from: currentStageId, to: newStageId });
      moveCandidateMutation.mutate({ applicationId, stageId: newStageId });
      return;
    }

    // If we reach here, it's likely a no-op (same stage or invalid move)
    console.log('🔄 No action needed for this drag operation');
  };

  return {
    sensors,
    activeCandidate,
    handleDragStart,
    handleDragEnd,
  };
};
