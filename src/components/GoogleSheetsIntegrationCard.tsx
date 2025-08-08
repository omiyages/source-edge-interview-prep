
// ABOUTME: Card component for displaying Google Sheets integration with sync functionality
// ABOUTME: Handles direct sync initiation and shows results for approval

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sheet, 
  RefreshCw, 
  Edit, 
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
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
  integration: any;
  onSync: (integration: any) => void;
  onEditMapping: (integration: any) => void;
  syncProgress?: SyncProgress;
}

export const GoogleSheetsIntegrationCard: React.FC<GoogleSheetsIntegrationCardProps> = ({
  integration,
  onSync,
  onEditMapping,
  syncProgress
}) => {
  const getProgressPercentage = () => {
    if (!syncProgress || syncProgress.total === 0) return 0;
    return Math.round((syncProgress.current / syncProgress.total) * 100);
  };

  const isActiveSync = syncProgress && (
    syncProgress.status === 'starting' || 
    syncProgress.status === 'processing'
  );

  const handleSync = () => {
    onSync(integration);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet className="w-5 h-5" />
            <span>{integration.sheet_name || 'Unnamed Sheet'}</span>
          </div>
          <Badge variant="outline">
            {Object.keys(integration.column_mappings || {}).length} mappings
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Sheet ID:</strong> {integration.sheet_id}</p>
            <p><strong>Range:</strong> {integration.range_specification}</p>
            {integration.last_sync_at && (
              <p><strong>Last sync:</strong> {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}</p>
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
                Sync Completed - Ready for Review
              </div>
              <div className="text-green-700 text-xs">
                Processed {syncProgress.current} rows: {syncProgress.createdCount} created, {syncProgress.updatedCount} updated
              </div>
            </div>
          )}

          {syncProgress?.status === 'error' && syncProgress.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-1">
                <Clock className="w-4 h-4" />
                Sync Errors
              </div>
              {syncProgress.errors.slice(0, 2).map((error, index) => (
                <p key={index} className="text-red-700 text-xs">{error}</p>
              ))}
              {syncProgress.errors.length > 2 && (
                <p className="text-red-600 text-xs">...and {syncProgress.errors.length - 2} more errors</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={isActiveSync}
              className="flex-1"
            >
              {isActiveSync ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {syncProgress?.status === 'starting' ? 'Starting...' : 'Syncing...'}
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
              onClick={() => onEditMapping(integration)}
              disabled={isActiveSync}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Mapping
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
