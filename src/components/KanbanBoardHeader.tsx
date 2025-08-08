
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { GoogleSheetsIntegrationSection } from './GoogleSheetsIntegrationSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useResetCandidates } from '@/hooks/useResetCandidates';

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
  const [showSheetsDialog, setShowSheetsDialog] = useState(false);
  const resetCandidatesMutation = useResetCandidates();

  const handleReset = () => {
    resetCandidatesMutation.mutate();
  };

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
          
          <Dialog open={showSheetsDialog} onOpenChange={setShowSheetsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Google Sheets
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Google Sheets Integration</DialogTitle>
              </DialogHeader>
              <GoogleSheetsIntegrationSection />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Candidate Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL candidates, pipeline entries, and import records from the database. 
                  This action cannot be undone. Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={resetCandidatesMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {resetCandidatesMutation.isPending ? 'Resetting...' : 'Reset Database'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={onAddCandidate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>
    </div>
  );
};
