
import React, { useState, memo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { CandidateCard } from './CandidateCard';
import { CandidateSearchDialog } from './CandidateSearchDialog';
import { KanbanBoardHeader } from './KanbanBoardHeader';
import { KanbanFilters } from './KanbanFilters';
import { useHiringStages, useCandidatesWithPipeline, useKanbanHelpers } from '@/hooks/useKanbanData';
import { useKanbanActions } from '@/hooks/useKanbanMutations';
import { useKanbanDragDrop } from '@/hooks/useKanbanDragDrop';
import { useKanbanFilters } from '@/hooks/useKanbanFilters';

export const KanbanBoard = memo(() => {
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  const { data: stages = [] } = useHiringStages();
  const { data: candidates = [] } = useCandidatesWithPipeline();
  const { 
    roleFilter, 
    companyFilter, 
    setRoleFilter, 
    setCompanyFilter, 
    filteredCandidates 
  } = useKanbanFilters(candidates);
  const { getCandidatesForStage } = useKanbanHelpers(filteredCandidates);
  const { handleSelectCandidate } = useKanbanActions(stages);
  const { sensors, activeCandidate, handleDragStart, handleDragEnd } = useKanbanDragDrop(filteredCandidates);

  return (
    <div className="h-full">
      <KanbanBoardHeader onAddCandidate={() => setShowSearchDialog(true)} />

      <KanbanFilters
        roleFilter={roleFilter}
        companyFilter={companyFilter}
        onRoleFilterChange={setRoleFilter}
        onCompanyFilterChange={setCompanyFilter}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto h-full pb-4">
          {/* All stage columns - including the new "New Candidate" stage */}
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
});

KanbanBoard.displayName = 'KanbanBoard';
