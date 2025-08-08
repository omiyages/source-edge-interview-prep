
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Sync, 
  Settings, 
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { GoogleSheetsIntegrationDialog } from './GoogleSheetsIntegrationDialog';
import { useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { formatDistanceToNow } from 'date-fns';

interface GoogleSheetsIntegrationCardProps {
  integration: {
    id: string;
    sheet_id: string;
    sheet_name: string | null;
    range_specification: string;
    column_mappings: Record<string, string>;
    last_sync_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export const GoogleSheetsIntegrationCard: React.FC<GoogleSheetsIntegrationCardProps> = ({
  integration
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { mutate: syncSheets, isPending: isSyncing, syncProgress } = useSyncGoogleSheets();

  const handleSync = () => {
    syncSheets(integration.id);
  };

  const getStatusBadge = () => {
    if (isSyncing || syncProgress.status === 'processing' || syncProgress.status === 'starting') {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Syncing...
      </Badge>;
    }
    
    if (syncProgress.status === 'completed') {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        Completed
      </Badge>;
    }
    
    if (syncProgress.status === 'error') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Error
      </Badge>;
    }

    return <Badge variant={integration.is_active ? "default" : "secondary"}>
      {integration.is_active ? "Active" : "Inactive"}
    </Badge>;
  };

  const getProgressPercentage = () => {
    if (syncProgress.total === 0) return 0;
    return Math.round((syncProgress.current / syncProgress.total) * 100);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <CardTitle className="text-lg">
                  {integration.sheet_name || 'Untitled Sheet'}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  ID: {integration.sheet_id.substring(0, 20)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sync Progress */}
          {(isSyncing || syncProgress.status === 'processing' || syncProgress.status === 'starting') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing progress</span>
                <span>{syncProgress.current} / {syncProgress.total}</span>
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

          {/* Error Messages */}
          {syncProgress.status === 'error' && syncProgress.errors.length > 0 && (
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

          {/* Integration Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Range:</span>
              <p className="font-mono">{integration.range_specification}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mappings:</span>
              <p>{Object.keys(integration.column_mappings || {}).length} fields</p>
            </div>
          </div>

          {/* Last Sync */}
          {integration.last_sync_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Last synced {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSync}
              disabled={isSyncing || syncProgress.status === 'processing' || syncProgress.status === 'starting'}
              className="flex-1"
            >
              {isSyncing || syncProgress.status === 'processing' || syncProgress.status === 'starting' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Sync className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <GoogleSheetsIntegrationDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        integration={integration}
      />
    </>
  );
};
