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
      console.log('Generating preview for:', { sheetId, range, columnMappings });
      
      // Get sample data from the Google Sheets
      const { data: response, error } = await supabase.functions.invoke('google-sheets-sample', {
        body: { sheetId, range: 'A1:Z10' }
      });

      if (error) {
        console.error('Sample data error:', error);
        throw error;
      }

      console.log('Sample data response:', response);

      if (!response?.values || response.values.length === 0) {
        throw new Error('No data found in the specified range');
      }

      const headers = response.values[0] || [];
      const dataRows = response.values.slice(1);

      console.log('Headers found:', headers);
      console.log('Data rows:', dataRows.length);

      // Get hiring stages for mapping
      const { data: stages } = await supabase
        .from('hiring_stages')
        .select('id, name')
        .order('order_index');

      console.log('Available stages:', stages?.map(s => s.name));

      const stageMap = new Map(stages?.map(s => [s.name.toLowerCase(), s.id]) || []);
      
      // Create fuzzy stage mapping
      const fuzzyStageMap = new Map();
      stages?.forEach(stage => {
        const name = stage.name.toLowerCase();
        fuzzyStageMap.set(name, stage.name);
        fuzzyStageMap.set(name.replace(/\s+/g, ''), stage.name);
        fuzzyStageMap.set(name.replace(/\s+/g, '_'), stage.name);
        fuzzyStageMap.set(name.replace(/\s+/g, '-'), stage.name);
        
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

      console.log('Fuzzy stage mappings:', Array.from(fuzzyStageMap.keys()));

      const candidates: PreviewCandidate[] = dataRows.map((row: string[], index: number) => {
        const candidate: PreviewCandidate = {
          name: '',
          rowNumber: index + 2,
          issues: []
        };

        // Map each column according to the mappings
        headers.forEach((header: string, colIndex: number) => {
          const mapping = columnMappings[header];
          const value = row[colIndex]?.toString()?.trim();
          
          if (!value) return;

          console.log(`Mapping ${header} (${mapping}): ${value}`);

          switch (mapping) {
            case 'full_name':
              candidate.name = value;
              break;
            case 'email':
              candidate.email = value;
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
                console.log(`✅ Exact match for "${value}": ${candidate.mappedStage}`);
              } else if (fuzzyMatch) {
                candidate.mappedStage = fuzzyMatch;
                console.log(`✅ Fuzzy match for "${value}": ${candidate.mappedStage}`);
              } else {
                candidate.mappedStage = stages?.[0]?.name || 'Default';
                candidate.issues.push(`Stage "${value}" not found, will use default stage`);
                console.log(`❌ No match for "${value}", using default`);
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
          candidate.issues.push('Missing candidate name');
        }

        console.log(`Processed candidate ${index + 1}:`, candidate);
        return candidate;
      });

      console.log('Generated preview with', candidates.length, 'candidates');
      setPreviewData(candidates);
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithProgress = useCallback(async (integrationId: string, syncData?: {
    sheetId: string;
    range: string;
    columnMappings: Record<string, string>;
  }) => {
    console.log('🚀 Starting sync with progress tracking...', { 
      integrationId, 
      previewDataLength: previewData.length,
      syncData 
    });
    
    // Set initial progress state
    setSyncProgress({
      current: 0,
      total: previewData.length || 100,
      status: 'syncing',
      errors: [],
      createdCount: 0,
      updatedCount: 0
    });

    // Force a small delay to ensure the UI updates
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Start progress simulation - slower updates to be more visible
      const totalItems = previewData.length || 100;
      let progressStep = 0;
      
      const progressInterval = setInterval(() => {
        progressStep++;
        setSyncProgress(prev => {
          if (prev.status !== 'syncing') return prev;
          
          const increment = Math.ceil(totalItems / 15); // 15 steps total
          const newCurrent = Math.min(prev.current + increment, totalItems - 5); // Leave some room for completion
          console.log('Progress update:', newCurrent, '/', totalItems);
          return { ...prev, current: newCurrent };
        });
      }, 400); // Update every 400ms for more visible progress

      // Call the sync function with proper data
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

      console.log('Calling sync function with:', requestBody);

      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: requestBody
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Sync error:', error);
        throw error;
      }

      console.log('Sync completed successfully:', data);

      setSyncProgress(prev => ({
        ...prev,
        current: prev.total,
        status: 'completed',
        createdCount: data?.createdCount || 0,
        updatedCount: data?.updatedCount || 0
      }));

      const message = data?.createdCount || data?.updatedCount 
        ? `Successfully synced ${data.processedCount} candidates (${data.createdCount} created, ${data.updatedCount} updated)`
        : `Successfully synced ${data?.processedCount || 'all'} candidates`;
      
      toast.success(message);
      
      if (data?.errors && data.errors.length > 0) {
        setSyncProgress(prev => ({
          ...prev,
          errors: data.errors
        }));
      }

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