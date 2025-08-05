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
      // Get sample data from the Google Sheets
      const { data: sampleData, error } = await supabase.functions.invoke('google-sheets-sample', {
        body: { sheetId, range }
      });

      if (error) throw error;

      // Get hiring stages for mapping
      const { data: stages } = await supabase
        .from('hiring_stages')
        .select('id, name')
        .order('order_index');

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

      const { headers, data: rows } = sampleData;
      
      const candidates: PreviewCandidate[] = rows.slice(1).map((row: string[], index: number) => {
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
              const exactMatch = stageMap.has(lowerStage) ? lowerStage : null;
              const fuzzyMatch = fuzzyStageMap.get(lowerStage) || 
                               fuzzyStageMap.get(lowerStage.replace(/\s+/g, '')) ||
                               fuzzyStageMap.get(lowerStage.replace(/\s+/g, '_'));
              
              if (exactMatch) {
                candidate.mappedStage = stages?.find(s => s.id === stageMap.get(exactMatch))?.name;
              } else if (fuzzyMatch) {
                candidate.mappedStage = fuzzyMatch;
              } else {
                candidate.mappedStage = stages?.[0]?.name || 'Default';
                candidate.issues.push(`Stage "${value}" not found, will use default stage`);
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

        return candidate;
      });

      setPreviewData(candidates);
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithProgress = useCallback(async (integrationId: string) => {
    setSyncProgress({
      current: 0,
      total: previewData.length,
      status: 'syncing',
      errors: []
    });

    try {
      // Call the sync function
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: { integrationId }
      });

      if (error) throw error;

      setSyncProgress(prev => ({
        ...prev,
        current: prev.total,
        status: 'completed'
      }));

      toast.success(`Successfully synced ${data.processedCount} candidates`);
      
      if (data.errors && data.errors.length > 0) {
        setSyncProgress(prev => ({
          ...prev,
          errors: data.errors
        }));
      }

      return data;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [error.message || 'Sync failed']
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