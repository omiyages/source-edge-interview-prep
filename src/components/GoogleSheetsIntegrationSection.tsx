
// ABOUTME: Section component for managing Google Sheets integrations
// ABOUTME: Handles sync workflow with preview and approval system

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sheet } from 'lucide-react';
import { GoogleSheetsIntegrationDialog } from './GoogleSheetsIntegrationDialog';
import { GoogleSheetsIntegrationCard } from './GoogleSheetsIntegrationCard';
import { SyncResultsPreviewDialog } from './SyncResultsPreviewDialog';
import { EditColumnMappingDialog } from './EditColumnMappingDialog';
import { useGoogleSheetsIntegrations, useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { toast } from 'sonner';

export const GoogleSheetsIntegrationSection: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showEditMappingDialog, setShowEditMappingDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);

  const { data: integrations, isLoading } = useGoogleSheetsIntegrations();
  const syncMutation = useSyncGoogleSheets();

  const handleSync = async (integration: any) => {
    console.log('🚀 Starting sync for integration:', integration.id);
    setSelectedIntegration(integration);
    setSyncResults(null);
    
    try {
      await syncMutation.mutateAsync(integration.id);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
    }
  };

  // Show preview dialog when sync completes successfully
  React.useEffect(() => {
    if (syncMutation.syncProgress?.status === 'completed' && selectedIntegration && !showPreviewDialog) {
      console.log('✅ Sync completed, showing preview dialog');
      
      // Mock sync results - in real implementation, this would come from the sync response
      const mockResults = {
        candidates: [], // This would be populated from actual sync results
        summary: {
          total: syncMutation.syncProgress.current || 0,
          created: syncMutation.syncProgress.createdCount || 0,
          updated: syncMutation.syncProgress.updatedCount || 0,
          skipped: 0,
          errors: syncMutation.syncProgress.errors || []
        }
      };
      
      setSyncResults(mockResults);
      setShowPreviewDialog(true);
    }
  }, [syncMutation.syncProgress, selectedIntegration, showPreviewDialog]);

  const handleApprove = async () => {
    if (!syncResults || !selectedIntegration) return;
    
    setIsApproving(true);
    try {
      console.log('✅ Approving sync results for integration:', selectedIntegration.id);
      
      // Here you would call an API to actually apply the changes
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Changes have been applied successfully!');
      setShowPreviewDialog(false);
      setSyncResults(null);
      setSelectedIntegration(null);
      
    } catch (error) {
      console.error('❌ Failed to apply changes:', error);
      toast.error(`Failed to apply changes: ${error.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = () => {
    console.log('❌ Rejecting sync results');
    setShowPreviewDialog(false);
    setSyncResults(null);
    setSelectedIntegration(null);
    toast.info('Sync results have been discarded');
  };

  const handleEditMapping = (integration: any) => {
    setSelectedIntegration(integration);
    setShowEditMappingDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sheet className="w-5 h-5" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sheet className="w-5 h-5" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations && integrations.length > 0 ? (
              integrations.map((integration) => (
                <GoogleSheetsIntegrationCard
                  key={integration.id}
                  integration={integration}
                  onSync={handleSync}
                  onEditMapping={handleEditMapping}
                  syncProgress={syncMutation.syncProgress}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No Google Sheets integrations configured yet.
              </p>
            )}
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Google Sheets Integration
            </Button>
          </div>
        </CardContent>
      </Card>

      <GoogleSheetsIntegrationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <SyncResultsPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        syncResults={syncResults}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={isApproving}
      />

      {selectedIntegration && (
        <EditColumnMappingDialog
          open={showEditMappingDialog}
          onOpenChange={setShowEditMappingDialog}
          integration={selectedIntegration}
        />
      )}
    </>
  );
};
