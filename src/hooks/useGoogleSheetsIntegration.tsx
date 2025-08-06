
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  errors: string[];
  createdCount?: number;
  updatedCount?: number;
}

interface GoogleSheetsIntegration {
  id: string;
  user_id: string;
  sheet_id: string;
  sheet_name: string | null;
  range_specification: string;
  column_mappings: Record<string, string>;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateGoogleSheetsIntegrationData {
  sheet_id: string;
  sheet_name?: string | null;
  range_specification?: string;
  column_mappings?: Record<string, string>;
}

interface UpdateGoogleSheetsIntegrationData {
  id: string;
  sheet_name?: string | null;
  range_specification?: string;
  column_mappings?: Record<string, string>;
}

export const useGoogleSheetsIntegrations = () => {
  return useQuery({
    queryKey: ['google-sheets-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GoogleSheetsIntegration[];
    },
  });
};

export const useCreateGoogleSheetsIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integration: CreateGoogleSheetsIntegrationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .insert({
          user_id: user.id,
          sheet_id: integration.sheet_id,
          sheet_name: integration.sheet_name,
          range_specification: integration.range_specification || 'A:Z',
          column_mappings: integration.column_mappings || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: 'Integration created',
        description: 'Google Sheets integration has been set up successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create integration: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateGoogleSheetsIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integration: UpdateGoogleSheetsIntegrationData) => {
      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .update({
          sheet_name: integration.sheet_name,
          range_specification: integration.range_specification,
          column_mappings: integration.column_mappings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: 'Integration updated',
        description: 'Google Sheets integration has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update integration: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useSyncGoogleSheets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    errors: [],
    createdCount: 0,
    updatedCount: 0
  });

  const mutation = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log('🚀 Starting sync with progress tracking for integration:', integrationId);
      
      try {
        // Get integration data first to understand what we're syncing
        const { data: integration, error: integrationError } = await supabase
          .from('google_sheets_integrations')
          .select('*')
          .eq('id', integrationId)
          .single();

        if (integrationError) throw integrationError;

        console.log('Starting sync for integration:', integration);

        // First, get a sample to estimate total rows
        const { data: sampleResponse, error: sampleError } = await supabase.functions.invoke('google-sheets-sample', {
          body: { 
            sheetId: integration.sheet_id, 
            range: integration.range_specification || 'A:Z'
          }
        });

        if (sampleError) {
          console.warn('Could not get sample data for progress estimation:', sampleError);
        }

        // Estimate total rows (sample gives us first 1000 rows typically)
        const estimatedTotal = sampleResponse?.values ? sampleResponse.values.length - 1 : 100; // -1 for header
        
        // Set initial progress state with estimated total
        setSyncProgress({
          current: 0,
          total: Math.max(estimatedTotal, 1), // Ensure at least 1
          status: 'syncing',
          errors: [],
          createdCount: 0,
          updatedCount: 0
        });

        console.log('Estimated total rows to process:', estimatedTotal);

        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));

        // Call the sync function
        const { data, error: syncError } = await supabase.functions.invoke('google-sheets-sync', {
          body: {
            integrationId: integration.id,
            sheetId: integration.sheet_id,
            range: integration.range_specification,
            columnMappings: integration.column_mappings,
          },
        });

        if (syncError) throw syncError;

        console.log('Sync completed successfully:', data);

        // Complete progress with actual numbers
        setSyncProgress(prev => ({
          ...prev,
          current: data?.processedCount || prev.total,
          total: data?.totalRows || prev.total,
          status: 'completed',
          createdCount: data?.createdCount || 0,
          updatedCount: data?.updatedCount || 0,
          errors: data?.errors || []
        }));

        return data;
      } catch (error) {
        console.error('❌ Sync failed:', error);
        setSyncProgress(prev => ({
          ...prev,
          status: 'error',
          errors: [error?.message || 'Sync failed']
        }));
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      
      const message = data?.createdCount || data?.updatedCount 
        ? `Successfully synced ${data.processedCount} candidates (${data.createdCount || 0} created, ${data.updatedCount || 0} updated)`
        : `Successfully synced ${data?.processedCount || 'all'} candidates`;
      
      toast({
        title: 'Sync completed',
        description: message,
      });

      // Reset progress after a delay
      setTimeout(() => {
        setSyncProgress(prev => ({ ...prev, status: 'idle' }));
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: `Failed to sync with Google Sheets: ${error.message}`,
        variant: 'destructive',
      });
      
      // Reset progress on error
      setTimeout(() => {
        setSyncProgress(prev => ({ ...prev, status: 'idle' }));
      }, 3000);
    },
  });

  return {
    ...mutation,
    syncProgress
  };
};
