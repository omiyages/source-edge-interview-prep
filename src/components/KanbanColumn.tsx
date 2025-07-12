import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CandidateCard } from './CandidateCard';
import { Badge } from '@/components/ui/badge';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  candidates: Candidate[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color,
  candidates,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      <div className="flex items-center justify-between mb-4 p-3 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-medium text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {candidates.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-muted/50 border-2 border-dashed border-primary' : 'bg-muted/20'
        }`}
      >
        <SortableContext
          items={candidates.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
              />
            ))}
          </div>
        </SortableContext>

        {candidates.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Drop candidates here
          </div>
        )}
      </div>
    </div>
  );
};