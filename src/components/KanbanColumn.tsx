
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { EditableCandidateCard } from './EditableCandidateCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  candidates: any[];
  showInactive?: boolean;
  onCandidateClick?: (candidate: any) => void;
}

export const KanbanColumn = ({ 
  id, 
  title, 
  color, 
  candidates, 
  showInactive = false,
  onCandidateClick
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Filter candidates based on showInactive flag
  const visibleCandidates = showInactive 
    ? candidates 
    : candidates.filter(candidate => candidate.is_active !== false);

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      <div 
        className="flex items-center gap-2 p-4 border-b bg-card"
        style={{ borderTopColor: color }}
      >
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {visibleCandidates.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-4 space-y-3 min-h-[200px] transition-colors",
          isOver && "bg-muted/50"
        )}
      >
        {visibleCandidates.map((candidate) => (
          <EditableCandidateCard
            key={candidate.applicationId || candidate.id}
            candidate={candidate}
            showInactive={showInactive}
            onClick={() => onCandidateClick?.(candidate)}
          />
        ))}
        
        {visibleCandidates.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No candidates
          </div>
        )}
      </div>
    </div>
  );
};
