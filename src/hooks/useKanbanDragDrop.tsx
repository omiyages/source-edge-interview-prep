import { useState } from 'react';
import { DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Candidate } from './useKanbanData';
import { useMoveCandidateMutation } from './useKanbanMutations';

export const useKanbanDragDrop = (candidates: Candidate[]) => {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const moveCandidateMutation = useMoveCandidateMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  return {
    sensors,
    activeCandidate,
    handleDragStart,
    handleDragEnd,
  };
};