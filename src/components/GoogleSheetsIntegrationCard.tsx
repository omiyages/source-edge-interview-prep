
// ABOUTME: This component displays Google Sheets integration cards with sync functionality
// ABOUTME: Shows sync progress, status badges, and integration details

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Settings, 
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit
} from 'lucide-react';
import { GoogleSheetsIntegrationDialog } from './GoogleSheetsIntegrationDialog';
import { useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { formatDistanceToNow } from 'date-fns';

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error';
  errors: string[];
  createdCount?: number;
  updatedCount?: number;
}

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
  onPreview?: () => void;
  onEditMapping?: () => void;
  syncProgress: SyncProgress;
}

export const GoogleSheetsIntegrationCard: React.FC<GoogleSheetsIntegrationCardProps> = ({
  integration,
  onPreview,
  onEditMapping,
  syncProgress
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { mutate: syncSheets, isPending: isSyncing } = useSyncGoogleSheets();

  // Force re-render when progress changes
  useEffect(() => {
    console.log('🎨 Card re-rendering with progress:', syncProgress);
  }, [syncProgress]);

  const handleSync = () => {
    console.log('🎯 Starting sync for integration:', integration.id);
    syncSheets(integration.id);
  };

  const getStatusBadge = () => {
    const isActiveSync = isSyncing || 
      syncProgress.status === 'processing' || 
      syncProgress.status === 'starting';

    if (isActiveSync) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        {syncProgress.status === 'starting' ? 'Starting...' : 'Syncing...'}
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
    const percentage = Math.round((syncProgress.current / syncProgress.total) * 100);
    console.log('📊 Progress percentage:', percentage, 'from', syncProgress.current, '/', syncProgress.total);
    return percentage;
  };

  const isActiveSync = isSyncing || 
    syncProgress.status === 'processing' || 
    syncProgress.status === 'starting';

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
          {isActiveSync && (
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

          {/* Success Summary */}
          {syncProgress.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-green-800 text-sm font-medium mb-1">
                <CheckCircle className="w-4 h-4" />
                Sync Completed Successfully
              </div>
              <div className="text-green-700 text-xs">
                Processed {syncProgress.current} rows: {syncProgress.createdCount} created, {syncProgress.updatedCount} updated
              </div>
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
              disabled={isActiveSync}
              className="flex-1"
            >
              {isActiveSync ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {syncProgress.status === 'starting' ? 'Starting...' : 'Syncing...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
            {onPreview && (
              <Button variant="outline" onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            {onEditMapping && (
              <Button variant="outline" onClick={onEditMapping}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
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
