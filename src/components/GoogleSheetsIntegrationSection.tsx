
// ABOUTME: Section component for managing Google Sheets integrations
// ABOUTME: Handles sync workflow with preview and approval system

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sheet } from 'lucide-react';
import { GoogleSheetsIntegrationDialog } from './GoogleSheetsIntegrationDialog';
import { GoogleSheetsIntegrationCard } from './GoogleSheetsIntegrationCard';
import { SyncResultsPreviewDialog } from './SyncResultsPreviewDialog';
import { EditColumnMappingDialog } from './EditColumnMappingDialog';
import { useGoogleSheetsIntegrations, useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { useSyncResults } from '@/hooks/useSyncResults';
import { toast } from 'sonner';

export const GoogleSheetsIntegrationSection: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditMappingDialog, setShowEditMappingDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  const { data: integrations, isLoading } = useGoogleSheetsIntegrations();
  const syncMutation = useSyncGoogleSheets();
  const { 
    syncResults, 
    isApproving, 
    fetchSyncResults, 
    approveSyncResults, 
    rejectSyncResults 
  } = useSyncResults();

  const handleSync = async (integration: any) => {
    console.log('🚀 Starting sync for integration:', integration.id);
    setSelectedIntegration(integration);
    
    try {
      await syncMutation.mutateAsync(integration.id);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
    }
  };

  // Fetch sync results when sync completes successfully
  useEffect(() => {
    const checkSyncResults = async () => {
      if (syncMutation.syncProgress?.status === 'completed' && selectedIntegration && !syncResults) {
        console.log('✅ Sync completed, fetching sync results');
        await fetchSyncResults(selectedIntegration.id);
      }
    };

    checkSyncResults();
  }, [syncMutation.syncProgress, selectedIntegration, syncResults, fetchSyncResults]);

  const handleApprove = async () => {
    if (!selectedIntegration) return;
    
    try {
      await approveSyncResults(selectedIntegration.id);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('❌ Failed to approve sync results:', error);
    }
  };

  const handleReject = () => {
    rejectSyncResults();
    setSelectedIntegration(null);
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
        open={!!syncResults}
        onOpenChange={(open) => !open && handleReject()}
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
