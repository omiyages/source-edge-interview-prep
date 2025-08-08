
// ABOUTME: Dialog component for previewing Google Sheets data before sync
// ABOUTME: Shows both processed candidates and raw sheet data with sync functionality

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  RefreshCw, 
  Users, 
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error';
  errors: string[];
  createdCount?: number;
  updatedCount?: number;
}

interface GoogleSheetsPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates?: any[];
  rawSheetData?: string[][];
  columnMappings?: Record<string, string>;
  onSync?: () => void;
  isLoading?: boolean;
  syncProgress?: SyncProgress;
}

export const GoogleSheetsPreviewDialog: React.FC<GoogleSheetsPreviewDialogProps> = ({
  open,
  onOpenChange,
  candidates = [],
  rawSheetData = [],
  columnMappings = {},
  onSync,
  isLoading = false,
  syncProgress
}) => {
  const [activeTab, setActiveTab] = useState('candidates');

  const handleSync = () => {
    if (onSync) {
      onSync();
    }
  };

  const getProgressPercentage = () => {
    if (!syncProgress || syncProgress.total === 0) return 0;
    return Math.round((syncProgress.current / syncProgress.total) * 100);
  };

  const isActiveSync = syncProgress && (
    syncProgress.status === 'starting' || 
    syncProgress.status === 'processing'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Google Sheets Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading sheet data...</span>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="candidates" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Processed Candidates ({candidates.length})
                </TabsTrigger>
                <TabsTrigger value="raw" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Raw Sheet Data ({rawSheetData.length} rows)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="candidates" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {candidates.length > 0 ? (
                      candidates.map((candidate, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm font-medium">Name:</span>
                              <p className="text-sm">{candidate.full_name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Email:</span>
                              <p className="text-sm">{candidate.email || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Company:</span>
                              <p className="text-sm">{candidate.current_company || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">LinkedIn:</span>
                              <p className="text-sm">{candidate.linkedin_profile || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Stage:</span>
                              <Badge variant="outline">{candidate.kanban_stage || 'New'}</Badge>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Status:</span>
                              <Badge variant={candidate.is_active ? "default" : "secondary"}>
                                {candidate.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No candidates processed yet. Check your column mappings.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="raw" className="flex-1 overflow-hidden">
                <div className="space-y-4 h-full flex flex-col">
                  {Object.keys(columnMappings).length > 0 && (
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-2">Column Mappings:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(columnMappings).map(([column, field]) => (
                          <div key={column} className="flex items-center gap-2">
                            <span className="font-mono bg-background px-2 py-1 rounded">
                              {column}
                            </span>
                            <span>→</span>
                            <span>{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <ScrollArea className="flex-1">
                    {rawSheetData.length > 0 ? (
                      <div className="space-y-2">
                        {rawSheetData.slice(0, 50).map((row, rowIndex) => (
                          <div key={rowIndex} className="border rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Row {rowIndex + 1}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm">
                              {row.map((cell, cellIndex) => {
                                const isHeader = rowIndex === 0;
                                const columnName = rawSheetData[0]?.[cellIndex] || `Column ${cellIndex + 1}`;
                                const mappedField = columnMappings[columnName];
                                
                                return (
                                  <div key={cellIndex} className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-mono text-xs px-2 py-1 rounded ${
                                          isHeader ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                          {columnName}
                                        </span>
                                        {mappedField && !isHeader && (
                                          <Badge variant="secondary" className="text-xs">
                                            → {mappedField}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className={`mt-1 break-words ${
                                        isHeader ? 'font-medium' : 'text-muted-foreground'
                                      }`}>
                                        {cell || '(empty)'}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {rawSheetData.length > 50 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            ... and {rawSheetData.length - 50} more rows
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No raw sheet data available
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Sync Progress */}
        {isActiveSync && syncProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {syncProgress.status === 'starting' ? 'Initializing sync...' : 'Syncing progress'}
              </span>
              <span>
                {syncProgress.current} / {syncProgress.total}
                {syncProgress.total > 0 && ` (${getProgressPercentage()}%)`}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
            {syncProgress.createdCount !== undefined && syncProgress.updatedCount !== undefined && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Created: {syncProgress.createdCount}</span>
                <span>Updated: {syncProgress.updatedCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Success/Error Messages */}
        {syncProgress?.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Sync Completed Successfully
            </div>
            <div className="text-green-700 text-xs">
              Processed {syncProgress.current} rows: {syncProgress.createdCount} created, {syncProgress.updatedCount} updated
            </div>
          </div>
        )}

        {syncProgress?.status === 'error' && syncProgress.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              Sync Errors
            </div>
            {syncProgress.errors.slice(0, 3).map((error, index) => (
              <p key={index} className="text-red-700 text-xs">{error}</p>
            ))}
            {syncProgress.errors.length > 3 && (
              <p className="text-red-600 text-xs">...and {syncProgress.errors.length - 3} more errors</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onSync && (
            <Button 
              onClick={handleSync} 
              disabled={isActiveSync || isLoading}
              className="flex items-center gap-2"
            >
              {isActiveSync ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {syncProgress?.status === 'starting' ? 'Starting...' : 'Syncing...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
