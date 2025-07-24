
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanBoardHeaderProps {
  onAddCandidate: () => void;
}

export const KanbanBoardHeader = ({ onAddCandidate }: KanbanBoardHeaderProps) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium">Candidate Pipeline</h3>
        <p className="text-sm text-muted-foreground">
          Drag candidates between stages or add new candidates to the pipeline
        </p>
      </div>
      <Button 
        onClick={onAddCandidate}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Candidate
      </Button>
    </div>
  );
};
