
import React, { useState, memo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { CandidateCard } from './CandidateCard';
import { CandidateDetailDialog } from './CandidateDetailDialog';
import { CandidateSearchDialog } from './CandidateSearchDialog';
import { KanbanBoardHeader } from './KanbanBoardHeader';
import { KanbanFilters } from './KanbanFilters';
import { useHiringStages, useCandidatesWithPipeline } from '@/hooks/useKanbanData';
import { useKanbanStageData } from '@/hooks/useKanbanStageData';
import { useKanbanActions } from '@/hooks/useKanbanMutations';
import { useKanbanDragDrop } from '@/hooks/useKanbanDragDrop';
import { useKanbanFilters } from '@/hooks/useKanbanFilters';

export const KanbanBoard = memo(() => {
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  
  const { data: stages = [] } = useHiringStages();
  const { data: candidates = [] } = useCandidatesWithPipeline(showInactive);
  const { 
    roleFilter, 
    companyFilter, 
    setRoleFilter, 
    setCompanyFilter, 
    filteredCandidates,
    availableRoles,
    availableCompanies
  } = useKanbanFilters(candidates);
  
  const { getCandidatesForStage } = useKanbanStageData(filteredCandidates);
  const { handleSelectCandidate } = useKanbanActions(stages);
  const { sensors, activeCandidate, handleDragStart, handleDragEnd } = useKanbanDragDrop(filteredCandidates);

  const handleCandidateClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetail(true);
  };

  const handleCandidateDetailClose = () => {
    setShowCandidateDetail(false);
    setSelectedCandidate(null);
  };

  const handleCandidateDelete = () => {
    setShowCandidateDetail(false);
    setSelectedCandidate(null);
    // The query will be invalidated by the delete mutation
  };

  return (
    <div className="h-full">
      <KanbanBoardHeader 
        onAddCandidate={() => setShowSearchDialog(true)}
        showInactive={showInactive}
        onToggleInactive={() => setShowInactive(!showInactive)}
      />

      <KanbanFilters
        roleFilter={roleFilter}
        companyFilter={companyFilter}
        onRoleFilterChange={setRoleFilter}
        onCompanyFilterChange={setCompanyFilter}
        availableRoles={availableRoles}
        availableCompanies={availableCompanies}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto h-full pb-4">
          {stages.map(stage => (
            <KanbanColumn
              key={stage.id}
              id={stage.id}
              title={stage.name}
              color={stage.color}
              candidates={getCandidatesForStage(stage.id)}
              showInactive={showInactive}
              onCandidateClick={handleCandidateClick}
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

      <CandidateDetailDialog
        open={showCandidateDetail}
        onOpenChange={setShowCandidateDetail}
        candidate={selectedCandidate}
        onRefresh={() => {
          // Queries will be automatically invalidated
        }}
        onDelete={handleCandidateDelete}
      />
    </div>
  );
});

KanbanBoard.displayName = 'KanbanBoard';
