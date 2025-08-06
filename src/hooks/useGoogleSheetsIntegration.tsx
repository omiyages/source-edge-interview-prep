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
    total: 100,
    status: 'idle',
    errors: [],
    createdCount: 0,
    updatedCount: 0
  });

  const mutation = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log('🚀 Starting sync with progress tracking for integration:', integrationId);
      
      // Set initial progress state
      setSyncProgress({
        current: 0,
        total: 100,
        status: 'syncing',
        errors: [],
        createdCount: 0,
        updatedCount: 0
      });

      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Start progress simulation
        const progressInterval = setInterval(() => {
          setSyncProgress(prev => {
            if (prev.status !== 'syncing') return prev;
            const increment = Math.ceil(prev.total / 15); // 15 steps
            const newCurrent = Math.min(prev.current + increment, prev.total - 5);
            console.log('Sync progress update:', newCurrent, '/', prev.total);
            return { ...prev, current: newCurrent };
          });
        }, 400); // Update every 400ms

        // Get integration data
        const { data: integration, error } = await supabase
          .from('google_sheets_integrations')
          .select('*')
          .eq('id', integrationId)
          .single();

        if (error) throw error;

        console.log('Starting sync for integration:', integration);

        // Call the sync function
        const { data, error: syncError } = await supabase.functions.invoke('google-sheets-sync', {
          body: {
            integrationId: integration.id,
            sheetId: integration.sheet_id,
            range: integration.range_specification,
            columnMappings: integration.column_mappings,
          },
        });

        clearInterval(progressInterval);

        if (syncError) throw syncError;

        console.log('Sync completed successfully:', data);

        // Complete progress
        setSyncProgress(prev => ({
          ...prev,
          current: prev.total,
          status: 'completed',
          createdCount: data?.createdCount || 0,
          updatedCount: data?.updatedCount || 0
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
      }, 3000);
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
