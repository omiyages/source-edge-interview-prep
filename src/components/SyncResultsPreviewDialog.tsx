
// ABOUTME: Dialog component for previewing sync results and approving changes
// ABOUTME: Shows all imported candidates with created/updated status for approval

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  UserPlus, 
  UserCheck, 
  AlertTriangle,
  Users,
  TrendingUp
} from 'lucide-react';

interface SyncCandidate {
  id?: string;
  full_name: string;
  email?: string;
  current_company?: string;
  applied_company?: string;
  applied_job_title?: string;
  stage?: string;
  is_active: boolean;
  action: 'created' | 'updated';
  row_number: number;
}

interface SyncResultsPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncResults?: {
    candidates: SyncCandidate[];
    summary: {
      total: number;
      created: number;
      updated: number;
      skipped: number;
      errors: string[];
    };
  };
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
}

export const SyncResultsPreviewDialog: React.FC<SyncResultsPreviewDialogProps> = ({
  open,
  onOpenChange,
  syncResults,
  onApprove,
  onReject,
  isApproving = false
}) => {
  if (!syncResults) return null;

  const { candidates, summary } = syncResults;
  const createdCandidates = candidates.filter(c => c.action === 'created');
  const updatedCandidates = candidates.filter(c => c.action === 'updated');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sync Results Preview - {summary.total} Candidates Processed
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-800">{summary.created}</p>
                  <p className="text-sm text-green-600">New Candidates</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-lg font-semibold text-blue-800">{summary.updated}</p>
                  <p className="text-sm text-blue-600">Updated Candidates</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-800">{summary.skipped}</p>
                  <p className="text-sm text-gray-600">Skipped Rows</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors Section */}
          {summary.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Sync Errors ({summary.errors.length})
              </div>
              <div className="space-y-1 text-xs text-red-700 max-h-20 overflow-y-auto">
                {summary.errors.slice(0, 5).map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
                {summary.errors.length > 5 && (
                  <p>...and {summary.errors.length - 5} more errors</p>
                )}
              </div>
            </div>
          )}

          {/* Candidates Tabs */}
          <Tabs defaultValue="created" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="created" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                New Candidates ({createdCandidates.length})
              </TabsTrigger>
              <TabsTrigger value="updated" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Updated Candidates ({updatedCandidates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="created" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {createdCandidates.length > 0 ? (
                    createdCandidates.map((candidate, index) => (
                      <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{candidate.full_name}</h3>
                              <Badge variant="outline" className="bg-green-100 border-green-300 text-green-700">
                                <UserPlus className="w-3 h-3 mr-1" />
                                New
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Email:</span> {candidate.email || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Company:</span> {candidate.current_company || candidate.applied_company || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Applied Role:</span> {candidate.applied_job_title || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Stage:</span> {candidate.stage || 'Default'}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Row {candidate.row_number}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No new candidates were created
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="updated" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {updatedCandidates.length > 0 ? (
                    updatedCandidates.map((candidate, index) => (
                      <div key={index} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{candidate.full_name}</h3>
                              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-700">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Updated
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Email:</span> {candidate.email || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Company:</span> {candidate.current_company || candidate.applied_company || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Applied Role:</span> {candidate.applied_job_title || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Stage:</span> {candidate.stage || 'Default'}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Row {candidate.row_number}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No candidates were updated
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onReject} disabled={isApproving}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={onApprove} 
                disabled={isApproving}
                className="flex items-center gap-2"
              >
                {isApproving ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Applying Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve & Apply Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
