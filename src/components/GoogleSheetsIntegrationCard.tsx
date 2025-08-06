
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, ExternalLink, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { EditColumnMappingDialog } from './EditColumnMappingDialog';

interface GoogleSheetsIntegration {
  id: string;
  sheet_id: string;
  sheet_name: string | null;
  range_specification: string;
  column_mappings: Record<string, string>;
  last_sync_at: string | null;
  is_active: boolean;
}

interface GoogleSheetsIntegrationCardProps {
  integration: GoogleSheetsIntegration;
}

export const GoogleSheetsIntegrationCard: React.FC<GoogleSheetsIntegrationCardProps> = ({
  integration,
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const syncMutation = useSyncGoogleSheets();

  const handleSync = () => {
    console.log('Sync button clicked for integration:', integration.id);
    syncMutation.mutate(integration.id);
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    return new Date(lastSync).toLocaleString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {integration.sheet_name || 'Google Sheet'}
            </CardTitle>
            <Badge variant={integration.is_active ? 'default' : 'secondary'}>
              {integration.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Sheet ID:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {integration.sheet_id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open(`https://docs.google.com/spreadsheets/d/${integration.sheet_id}/edit`, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Range:</p>
              <p className="text-sm text-muted-foreground">{integration.range_specification}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Column Mappings:</p>
              <div className="text-sm text-muted-foreground">
                {Object.keys(integration.column_mappings).length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {Object.entries(integration.column_mappings).map(([column, field]) => (
                      <div key={column} className="text-xs">
                        <span className="font-mono">{column}</span> → <span>{field}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  'No mappings configured'
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Last Sync:</p>
              <p className="text-sm text-muted-foreground">
                {formatLastSync(integration.last_sync_at)}
              </p>
            </div>

            {/* Progress Bar */}
            {syncMutation.syncProgress && syncMutation.syncProgress.status !== 'idle' && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {syncMutation.syncProgress.status === 'processing' && 'Syncing candidates...'}
                    {syncMutation.syncProgress.status === 'completed' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Sync completed!
                      </div>
                    )}
                    {syncMutation.syncProgress.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Sync failed
                      </div>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {syncMutation.syncProgress.current} / {syncMutation.syncProgress.total}
                    {syncMutation.syncProgress.status === 'completed' && syncMutation.syncProgress.createdCount !== undefined && (
                      <span className="ml-2 text-green-600">
                        ({syncMutation.syncProgress.createdCount} created, {syncMutation.syncProgress.updatedCount} updated)
                      </span>
                    )}
                  </span>
                </div>
                <Progress 
                  value={(syncMutation.syncProgress.current / syncMutation.syncProgress.total) * 100} 
                  className="w-full" 
                />
                {syncMutation.syncProgress.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    {syncMutation.syncProgress.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-3 h-3" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="flex-1"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditColumnMappingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        integration={integration}
      />
    </>
  );
};
