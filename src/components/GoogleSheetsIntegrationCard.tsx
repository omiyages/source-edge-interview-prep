
// ABOUTME: Modern card component for Google Sheets integrations with LMS-inspired design
// ABOUTME: Features clean layout, sync controls, and integration management with enhanced visual styling

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ExternalLink, Edit, Sheet, Calendar, Settings } from 'lucide-react';
import { useSyncGoogleSheets } from '@/hooks/useGoogleSheetsIntegration';
import { EditColumnMappingDialog } from './EditColumnMappingDialog';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const handleSync = () => {
    syncMutation.mutate(integration.id);
  };

  const handleSaveMappings = async (mappings: Record<string, string>) => {
    try {
      const { error } = await supabase
        .from('google_sheets_integrations')
        .update({ column_mappings: mappings })
        .eq('id', integration.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast.success('Column mappings updated successfully');
    } catch (error: any) {
      console.error('Error updating column mappings:', error);
      toast.error('Failed to update column mappings');
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never synced';
    const date = new Date(lastSync);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="group relative bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-green-500/5 pointer-events-none" />
        
        {/* Status indicator bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${integration.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />

        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Sheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {integration.sheet_name || 'Google Sheet'}
                </CardTitle>
                <Badge 
                  variant={integration.is_active ? 'default' : 'secondary'}
                  className={`mt-1 font-medium ${integration.is_active 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                >
                  {integration.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Sheet details */}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Sheet Information</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open(`https://docs.google.com/spreadsheets/d/${integration.sheet_id}/edit`, '_blank');
                  }}
                  className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Range:</span> {integration.range_specification}
                </p>
                <p className="text-xs text-gray-600 font-mono truncate">
                  ID: {integration.sheet_id.slice(0, 20)}...
                </p>
              </div>
            </div>

            {/* Column mappings */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-800">Column Mappings</span>
                <span className="text-xs text-blue-600">
                  {Object.keys(integration.column_mappings).length} mapped
                </span>
              </div>
              {Object.keys(integration.column_mappings).length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(integration.column_mappings).slice(0, 3).map(([column, field]) => (
                    <div key={column} className="text-xs text-blue-700 flex justify-between">
                      <span className="font-mono">{column}</span> 
                      <span>→ {field}</span>
                    </div>
                  ))}
                  {Object.keys(integration.column_mappings).length > 3 && (
                    <div className="text-xs text-blue-600 italic">
                      +{Object.keys(integration.column_mappings).length - 3} more...
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-blue-600 italic">No mappings configured</p>
              )}
            </div>

            {/* Last sync info */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Last sync: {formatLastSync(integration.last_sync_at)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
              size="sm"
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
              className="hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-1" />
              Configure
            </Button>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/20 via-green-500/60 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </CardContent>
      </Card>

      <EditColumnMappingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        integration={integration}
        onSave={handleSaveMappings}
      />
    </>
  );
};
