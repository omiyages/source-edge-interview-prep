
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sheet } from 'lucide-react';
import { GoogleSheetsIntegrationDialog } from './GoogleSheetsIntegrationDialog';
import { GoogleSheetsIntegrationCard } from './GoogleSheetsIntegrationCard';
import { GoogleSheetsPreviewDialog } from './GoogleSheetsPreviewDialog';
import { EditColumnMappingDialog } from './EditColumnMappingDialog';
import { useGoogleSheetsIntegrations, useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { useGoogleSheetsPreview } from '@/hooks/useGoogleSheetsPreview';

export const GoogleSheetsIntegrationSection: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showEditMappingDialog, setShowEditMappingDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  const { data: integrations, isLoading } = useGoogleSheetsIntegrations();
  const syncMutation = useSyncGoogleSheets();
  const { 
    previewData, 
    rawSheetData,
    isLoading: isPreviewLoading, 
    generatePreview 
  } = useGoogleSheetsPreview();

  const handlePreview = async (integration: any) => {
    setSelectedIntegration(integration);
    await generatePreview(
      integration.sheet_id,
      integration.range_specification || 'A:Z',
      integration.column_mappings || {}
    );
    setShowPreviewDialog(true);
  };

  const handleSync = () => {
    if (selectedIntegration) {
      syncMutation.mutate(selectedIntegration.id);
    }
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
                  onPreview={() => handlePreview(integration)}
                  onEditMapping={() => handleEditMapping(integration)}
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

      <GoogleSheetsPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        candidates={previewData}
        rawSheetData={rawSheetData}
        columnMappings={selectedIntegration?.column_mappings}
        onSync={handleSync}
        isLoading={isPreviewLoading}
        syncProgress={syncMutation.syncProgress}
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
