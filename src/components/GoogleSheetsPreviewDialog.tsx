
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Table, Users } from 'lucide-react';

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
  rawSheetData?: string[][];
  columnMappings?: Record<string, string>;
}

export const GoogleSheetsPreviewDialog: React.FC<GoogleSheetsPreviewDialogProps> = ({
  open,
  onOpenChange,
  candidates,
  onSync,
  isLoading,
  syncProgress,
  rawSheetData,
  columnMappings
}) => {
  const [activeTab, setActiveTab] = useState('processed');

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

  const headers = rawSheetData && rawSheetData.length > 0 ? rawSheetData[0] : [];
  const dataRows = rawSheetData && rawSheetData.length > 1 ? rawSheetData.slice(1, 11) : []; // Show first 10 rows

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processed" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Processed Data ({candidates.length})
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Raw Sheet Data ({dataRows.length + 1})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processed" className="flex-1 overflow-y-auto">
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
          </TabsContent>

          <TabsContent value="raw" className="flex-1 overflow-auto">
            {rawSheetData && rawSheetData.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Showing raw data from your Google Sheet (first 10 rows):</p>
                </div>
                
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border p-2 text-left font-medium">#</th>
                        {headers.map((header, index) => (
                          <th key={index} className="border p-2 text-left font-medium min-w-[120px]">
                            <div className="space-y-1">
                              <div>{header}</div>
                              {columnMappings?.[header] && (
                                <Badge variant="outline" className="text-xs">
                                  → {columnMappings[header]}
                                </Badge>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                          <td className="border p-2 text-muted-foreground">{rowIndex + 2}</td>
                          {headers.map((header, colIndex) => {
                            const cellValue = row[colIndex] || '';
                            const mapping = columnMappings?.[header];
                            const isImportant = mapping === 'full_name' || mapping === 'email';
                            const isEmpty = !cellValue || cellValue.trim() === '';
                            
                            return (
                              <td 
                                key={colIndex} 
                                className={`border p-2 ${
                                  isImportant && isEmpty ? 'bg-red-50 text-red-700' : ''
                                } ${isImportant ? 'font-medium' : ''}`}
                              >
                                {cellValue || (
                                  <span className="text-gray-400 italic">empty</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rawSheetData.length > 11 && (
                  <div className="text-sm text-muted-foreground text-center p-2">
                    ... and {rawSheetData.length - 11} more rows
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Table className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No raw sheet data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

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
