
import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { CandidateCard } from './CandidateCard';
import { CandidateSearchDialog } from './CandidateSearchDialog';
import { KanbanBoardHeader } from './KanbanBoardHeader';
import { useHiringStages, useCandidatesWithPipeline, useKanbanHelpers } from '@/hooks/useKanbanData';
import { useKanbanActions } from '@/hooks/useKanbanMutations';
import { useKanbanDragDrop } from '@/hooks/useKanbanDragDrop';

export const KanbanBoard = () => {
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  const { data: stages = [] } = useHiringStages();
  const { data: candidates = [] } = useCandidatesWithPipeline();
  const { getCandidatesForStage } = useKanbanHelpers(candidates);
  const { handleSelectCandidate } = useKanbanActions(stages);
  const { sensors, activeCandidate, handleDragStart, handleDragEnd } = useKanbanDragDrop(candidates);

  return (
    <div className="h-full">
      <KanbanBoardHeader onAddCandidate={() => setShowSearchDialog(true)} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto h-full pb-4">
          {/* All stage columns - including unassigned if it exists as a hiring stage */}
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
