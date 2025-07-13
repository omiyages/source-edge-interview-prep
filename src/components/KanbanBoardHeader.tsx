
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useCleanupSpecificCandidatesMutation } from '@/hooks/useKanbanMutations';
import { useAuth } from '@/hooks/useAuth';

interface KanbanBoardHeaderProps {
  onAddCandidate: () => void;
}

export const KanbanBoardHeader: React.FC<KanbanBoardHeaderProps> = ({
  onAddCandidate,
}) => {
  const { isAdmin } = useAuth();
  const cleanupCandidatesMutation = useCleanupSpecificCandidatesMutation();

  const handleCleanup = () => {
    if (window.confirm('Are you sure you want to remove Paul Lee and Namtae Lee from the pipeline? This action cannot be undone.')) {
      cleanupCandidatesMutation.mutate();
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Candidate Pipeline</h2>
        <p className="text-muted-foreground">Drag and drop candidates through hiring stages</p>
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <Button
            variant="outline"
            onClick={handleCleanup}
            disabled={cleanupCandidatesMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {cleanupCandidatesMutation.isPending ? 'Cleaning...' : 'Cleanup Paul & Namtae'}
          </Button>
        )}
        <Button onClick={onAddCandidate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Candidate
        </Button>
      </div>
    </div>
  );
};
