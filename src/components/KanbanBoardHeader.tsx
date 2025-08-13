
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface KanbanBoardHeaderProps {
  onAddCandidate: () => void;
  showInactive: boolean;
  onToggleInactive: () => void;
}

export const KanbanBoardHeader: React.FC<KanbanBoardHeaderProps> = ({
  onAddCandidate,
  showInactive,
  onToggleInactive,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidate Pipeline</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={onToggleInactive}
            />
            <Label htmlFor="show-inactive">Show Inactive</Label>
          </div>
          
          <Button onClick={onAddCandidate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>
    </div>
  );
};
