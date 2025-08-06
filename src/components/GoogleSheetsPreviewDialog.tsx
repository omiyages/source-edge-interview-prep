import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PreviewCandidate {
  name: string;
  email?: string;
  company?: string;
  appliedCompany?: string;
  appliedJobTitle?: string;
  stage?: string;
  mappedStage?: string;
  isActive?: boolean;
  rowNumber: number;
  issues: string[];
}

interface GoogleSheetsPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: PreviewCandidate[];
  onSync: () => void;
  isLoading: boolean;
  syncProgress?: {
    current: number;
    total: number;
    status: 'idle' | 'syncing' | 'completed' | 'error';
    errors: string[];
    createdCount?: number;
    updatedCount?: number;
  };
}

export const GoogleSheetsPreviewDialog: React.FC<GoogleSheetsPreviewDialogProps> = ({
  open,
  onOpenChange,
  candidates,
  onSync,
  isLoading,
  syncProgress
}) => {
  const getStageVariant = (original?: string, mapped?: string) => {
    if (!original) return 'destructive';
    if (mapped && mapped !== original) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (issues: string[]) => {
    if (issues.length === 0) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (issues.some(issue => issue.includes('Missing'))) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const progressPercentage = syncProgress ? (syncProgress.current / syncProgress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Preview - {candidates.length} Candidates</DialogTitle>
        </DialogHeader>

        {syncProgress && syncProgress.status !== 'idle' && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {syncProgress.status === 'syncing' && 'Syncing candidates...'}
                {syncProgress.status === 'completed' && 'Sync completed!'}
                {syncProgress.status === 'error' && 'Sync failed'}
              </span>
              <span className="text-sm text-muted-foreground">
                {syncProgress.current} / {syncProgress.total}
                {syncProgress.status === 'completed' && syncProgress.createdCount !== undefined && (
                  <span className="ml-2 text-green-600">
                    ({syncProgress.createdCount} created, {syncProgress.updatedCount} updated)
                  </span>
                )}
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            {syncProgress.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                {syncProgress.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="w-3 h-3" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-2">
            {candidates.map((candidate, index) => (
              <div key={index} className="border rounded-lg p-3 hover:bg-muted/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(candidate.issues)}
                    <div>
                      <h4 className="font-medium">{candidate.name || `Row ${candidate.rowNumber}`}</h4>
                      {candidate.email && (
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={candidate.isActive !== false ? 'default' : 'secondary'}>
                    {candidate.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Company:</span>
                    <p className="truncate">{candidate.company || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Applied Company:</span>
                    <p className="truncate">{candidate.appliedCompany || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Applied Role:</span>
                    <p className="truncate">{candidate.appliedJobTitle || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stage:</span>
                    <div className="flex items-center gap-1">
                      <Badge variant={getStageVariant(candidate.stage, candidate.mappedStage)}>
                        {candidate.mappedStage || candidate.stage || 'Default'}
                      </Badge>
                      {candidate.stage && candidate.mappedStage && candidate.stage !== candidate.mappedStage && (
                        <span className="text-xs text-muted-foreground">
                          (mapped from "{candidate.stage}")
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {candidate.issues.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {candidate.issues.map((issue, issueIndex) => (
                      <div key={issueIndex} className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {candidates.filter(c => c.issues.length === 0).length} valid candidates, {' '}
            {candidates.filter(c => c.issues.length > 0).length} with issues
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={onSync} 
              disabled={isLoading || syncProgress?.status === 'syncing'}
            >
              {isLoading || syncProgress?.status === 'syncing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Start Sync'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};