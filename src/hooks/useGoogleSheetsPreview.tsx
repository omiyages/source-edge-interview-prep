
// ABOUTME: Hook for generating Google Sheets preview data and managing sync progress
// ABOUTME: Handles data preview generation with stage mapping and validation

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PreviewCandidate {
  name: string;
  email?: string;
  company?: string;
  appliedCompany?: string;
  appliedJobTitle?: string;
  stage?: string;
  mappedStage?: string;
  isActive?: boolean;
  rowNumber: number;
  issues: string[];
}

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  errors: string[];
  createdCount?: number;
  updatedCount?: number;
}

export const useGoogleSheetsPreview = () => {
  const [previewData, setPreviewData] = useState<PreviewCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    errors: []
  });

  const generatePreview = useCallback(async (
    sheetId: string, 
    range: string, 
    columnMappings: Record<string, string>
  ) => {
    setIsLoading(true);
    try {
      console.log('🔍 Generating preview for:', { sheetId, range, totalMappings: Object.keys(columnMappings).length });
      
      // Get sample data from Google Sheets (first 50 rows for preview)
      const { data: response, error } = await supabase.functions.invoke('google-sheets-sample', {
        body: { sheetId, range: 'A1:Z50' }
      });

      if (error) {
        console.error('❌ Sample data error:', error);
        throw error;
      }

      console.log('📊 Sample data response:', {
        hasValues: !!response?.values,
        totalRows: response?.values?.length || 0
      });

      if (!response?.values || response.values.length === 0) {
        throw new Error('No data found in the specified range');
      }

      const headers = response.values[0] || [];
      const dataRows = response.values.slice(1);

      console.log('📋 Preview data summary:', {
        headers: headers.length,
        dataRows: dataRows.length,
        mappedFields: Object.keys(columnMappings).length
      });

      // Get hiring stages for mapping
      const { data: stages } = await supabase
        .from('hiring_stages')
        .select('id, name')
        .order('order_index');

      const stageMap = new Map(stages?.map(s => [s.name.toLowerCase(), s.id]) || []);
      
      // Create comprehensive fuzzy stage mapping
      const fuzzyStageMap = new Map();
      stages?.forEach(stage => {
        const name = stage.name.toLowerCase();
        fuzzyStageMap.set(name, stage.name);
        fuzzyStageMap.set(name.replace(/\s+/g, ''), stage.name);
        fuzzyStageMap.set(name.replace(/\s+/g, '_'), stage.name);
        fuzzyStageMap.set(name.replace(/\s+/g, '-'), stage.name);
        
        // Add common variations
        if (name.includes('interview')) {
          const num = name.match(/\d+/)?.[0];
          if (num) {
            fuzzyStageMap.set(`interview${num}`, stage.name);
            fuzzyStageMap.set(`int${num}`, stage.name);
          }
        }
        if (name.includes('technical')) {
          fuzzyStageMap.set('tech', stage.name);
          fuzzyStageMap.set('technical', stage.name);
        }
        if (name.includes('hr')) {
          fuzzyStageMap.set('hr', stage.name);
          fuzzyStageMap.set('hr screen', stage.name);
          fuzzyStageMap.set('hrscreen', stage.name);
        }
      });

      console.log('🎯 Stage mapping setup:', {
        totalStages: stages?.length || 0,
        fuzzyMappings: fuzzyStageMap.size
      });

      const candidates: PreviewCandidate[] = dataRows.map((row: string[], index: number) => {
        const candidate: PreviewCandidate = {
          name: '',
          rowNumber: index + 2,
          issues: []
        };

        // Process each column based on mappings
        headers.forEach((header: string, colIndex: number) => {
          const mapping = columnMappings[header];
          const value = row[colIndex]?.toString()?.trim();
          
          if (!value || !mapping) return;

          switch (mapping) {
            case 'full_name':
              candidate.name = value;
              break;
            case 'email':
              candidate.email = value;
              // Basic email validation
              if (value && !value.includes('@')) {
                candidate.issues.push('Invalid email format');
              }
              break;
            case 'current_company':
              candidate.company = value;
              break;
            case 'applied_company':
              candidate.appliedCompany = value;
              break;
            case 'applied_job_title':
              candidate.appliedJobTitle = value;
              break;
            case 'kanban_stage':
            case 'stage':
              candidate.stage = value;
              // Try to map the stage
              const lowerStage = value.toLowerCase().trim();
              const exactMatch = Array.from(stageMap.keys()).find(key => key === lowerStage);
              const fuzzyMatch = fuzzyStageMap.get(lowerStage) || 
                               fuzzyStageMap.get(lowerStage.replace(/\s+/g, '')) ||
                               fuzzyStageMap.get(lowerStage.replace(/\s+/g, '_'));
              
              if (exactMatch) {
                candidate.mappedStage = stages?.find(s => s.id === stageMap.get(exactMatch))?.name;
              } else if (fuzzyMatch) {
                candidate.mappedStage = fuzzyMatch;
              } else {
                candidate.mappedStage = stages?.[0]?.name || 'Default';
                candidate.issues.push(`Stage "${value}" not recognized, will use default stage`);
              }
              break;
            case 'is_active':
              const lowerValue = value.toLowerCase().trim();
              candidate.isActive = lowerValue === 'yes' || lowerValue === 'active' || lowerValue === 'true' || lowerValue === '1';
              break;
          }
        });

        // Validate required fields
        if (!candidate.name) {
          candidate.issues.push('Missing candidate name - row will be skipped');
        }

        return candidate;
      });

      console.log('✅ Preview generated:', {
        totalCandidates: candidates.length,
        validCandidates: candidates.filter(c => c.issues.length === 0).length,
        candidatesWithIssues: candidates.filter(c => c.issues.length > 0).length
      });

      setPreviewData(candidates);
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      toast.error(`Failed to generate preview: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithProgress = useCallback(async (integrationId: string, syncData?: {
    sheetId: string;
    range: string;
    columnMappings: Record<string, string>;
  }) => {
    console.log('🚀 Starting sync with progress tracking:', { 
      integrationId, 
      previewDataLength: previewData.length,
      hasCustomSyncData: !!syncData 
    });
    
    // Initialize progress state
    setSyncProgress({
      current: 0,
      total: previewData.length > 0 ? previewData.length : 100,
      status: 'syncing',
      errors: [],
      createdCount: 0,
      updatedCount: 0
    });

    try {
      // Prepare request data
      const requestBody = syncData ? {
        integrationId,
        sheetId: syncData.sheetId,
        range: syncData.range,
        columnMappings: syncData.columnMappings
      } : {
        integrationId,
        sheetId: '',
        range: '',
        columnMappings: {}
      };

      console.log('📤 Calling sync function with data:', {
        integrationId: requestBody.integrationId,
        hasSheetId: !!requestBody.sheetId,
        mappingCount: Object.keys(requestBody.columnMappings).length
      });

      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Sync function error:', error);
        throw error;
      }

      console.log('✅ Sync completed successfully:', {
        processedCount: data?.processedCount || 0,
        createdCount: data?.createdCount || 0,
        updatedCount: data?.updatedCount || 0,
        errorCount: data?.errorCount || 0
      });

      // Update progress with final results
      setSyncProgress(prev => ({
        ...prev,
        current: data?.processedCount || prev.total,
        total: data?.totalRows || prev.total,
        status: 'completed',
        createdCount: data?.createdCount || 0,
        updatedCount: data?.updatedCount || 0,
        errors: data?.errors || []
      }));

      const message = data?.createdCount || data?.updatedCount 
        ? `Successfully synced ${data.processedCount} candidates (${data.createdCount} created, ${data.updatedCount} updated)`
        : `Successfully synced ${data?.processedCount || 'all'} candidates`;
      
      toast.success(message);
      
      return data;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [error?.message || 'Sync failed']
      }));
      toast.error(`Sync failed: ${error.message}`);
      throw error;
    }
  }, [previewData]);

  return {
    previewData,
    isLoading,
    syncProgress,
    generatePreview,
    syncWithProgress,
    setSyncProgress
  };
};
