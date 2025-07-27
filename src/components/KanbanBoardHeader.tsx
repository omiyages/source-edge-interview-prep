
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, EyeOff, Eye } from 'lucide-react';

interface KanbanBoardHeaderProps {
  onAddCandidate: () => void;
  showInactive: boolean;
  onToggleInactive: () => void;
}

export const KanbanBoardHeader = ({ onAddCandidate, showInactive, onToggleInactive }: KanbanBoardHeaderProps) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium">Candidate Pipeline</h3>
        <p className="text-sm text-muted-foreground">
          Drag candidates between stages or add new candidates to the pipeline
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onToggleInactive}
          variant="outline"
          size="sm"
        >
          {showInactive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showInactive ? 'Hide Inactive' : 'Show Inactive'}
        </Button>
        <Button 
          onClick={onAddCandidate}
          variant="gradient"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </div>
    </div>
  );
};
