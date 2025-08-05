import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Info as InfoIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { GoogleSheetsPreviewDialog } from './GoogleSheetsPreviewDialog';
import { useGoogleSheetsPreview } from '@/hooks/useGoogleSheetsPreview';
import { useCreateGoogleSheetsIntegration } from '@/hooks/useGoogleSheetsIntegration';
import { useGoogleSheetsSample } from '@/hooks/useGoogleSheetsSample';
import { useHiringStages } from '@/hooks/useKanbanData';
import { ColumnMappingPreview } from './ColumnMappingPreview';

const CANDIDATE_FIELDS = [
  { value: '', label: 'Select a field...' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone_number', label: 'Phone Number' },
  { value: 'linkedin_profile', label: 'LinkedIn Profile' },
  { value: 'current_company', label: 'Current Company' },
  { value: 'years_of_experience', label: 'Years of Experience' },
  { value: 'salary', label: 'Salary' },
  { value: 'skillsets', label: 'Skills' },
  { value: 'past_companies', label: 'Past Companies' },
  { value: 'general_notes', label: 'General Notes' },
  { value: 'applied_company', label: 'Applied Company' },
  { value: 'applied_job_title', label: 'Applied Job Title' },
  { value: 'is_active', label: 'Active Status (Yes/No)' },
  { value: 'kanban_stage', label: 'Kanban Stage' },
];

interface GoogleSheetsIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: any;
}

export const GoogleSheetsIntegrationDialog: React.FC<GoogleSheetsIntegrationDialogProps> = ({
  open,
  onOpenChange,
  integration,
}) => {
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [range, setRange] = useState('A:Z');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);

  const createIntegration = useCreateGoogleSheetsIntegration();
  const { sampleData, isLoading: isLoadingSample, fetchSampleData } = useGoogleSheetsSample();
  const { data: hiringStages } = useHiringStages();
  
  const { 
    previewData, 
    isLoading: isPreviewLoading, 
    syncProgress, 
    generatePreview, 
    syncWithProgress 
  } = useGoogleSheetsPreview();

  useEffect(() => {
    if (integration) {
      setSheetId(integration.sheet_id || '');
      setSheetName(integration.sheet_name || '');
      setRange(integration.range_specification || 'A:Z');
      setColumnMappings(integration.column_mappings || {});
    }
  }, [integration]);

  useEffect(() => {
    if (sampleData && sampleData.length > 0) {
      const headers = sampleData[0] || [];
      setSampleColumns(headers);
      // Auto-map columns if they match field names
      const autoMappings: Record<string, string> = {};
      headers.forEach((header: string) => {
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
        const matchingField = CANDIDATE_FIELDS.find(field => 
          field.value === normalizedHeader || 
          field.label.toLowerCase().replace(/\s+/g, '_') === normalizedHeader
        );
        if (matchingField && matchingField.value) {
          autoMappings[header] = matchingField.value;
        }
      });
      setColumnMappings(prev => ({ ...autoMappings, ...prev }));
    }
  }, [sampleData]);

  const handleSubmit = () => {
    if (!sheetId.trim()) {
      return;
    }

    createIntegration.mutate({
      sheet_id: sheetId,
      sheet_name: sheetName || null,
      range_specification: range,
      column_mappings: columnMappings,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSheetId('');
    setSheetName('');
    setRange('A:Z');
    setColumnMappings({});
    setSampleColumns([]);
    setShowPreview(false);
  };

  const handlePreviewToggle = () => {
    if (!showPreview && sheetId.trim()) {
      fetchSampleData(sheetId, sheetName, 'A1:Z10');
    }
    setShowPreview(!showPreview);
  };

  const handleGeneratePreview = async () => {
    if (!sheetId.trim() || !Object.keys(columnMappings).length) return;
    
    await generatePreview(sheetId, range, columnMappings);
    setShowPreviewDialog(true);
  };

  const handleSyncFromPreview = async () => {
    try {
      // First create the integration
      const integrationData = {
        sheet_id: sheetId,
        sheet_name: sheetName,
        range_specification: range,
        column_mappings: columnMappings
      };

      const result = await createIntegration.mutateAsync(integrationData);
      
      // Then sync the data
      if (result?.id) {
        await syncWithProgress(result.id);
        // Only close dialogs after successful sync
        setTimeout(() => {
          setShowPreviewDialog(false);
          onOpenChange(false);
          resetForm();
        }, 2000); // Give time to see completion
      }
    } catch (error) {
      console.error('Failed to create integration and sync:', error);
    }
  };

  const updateColumnMapping = (column: string, mapping: string) => {
    setColumnMappings({
      ...columnMappings,
      [column]: mapping,
    });
  };

  const removeColumnMapping = (column: string) => {
    const newMappings = { ...columnMappings };
    delete newMappings[column];
    setColumnMappings(newMappings);
    setSampleColumns(sampleColumns.filter(col => col !== column));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {integration ? 'Edit' : 'Create'} Google Sheets Integration
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sheetId">Google Sheets ID</Label>
              <Input
                id="sheetId"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="Enter Google Sheets ID from the URL"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Extract the ID from your Google Sheets URL: https://docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
              </p>
            </div>

            <div>
              <Label htmlFor="sheetName">Sheet Name (Optional)</Label>
              <Input
                id="sheetName"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g., Sheet1, Pipeline, Candidates"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="e.g., A:Z or Sheet1!A1:Z100"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Column Mappings</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewToggle}
                  disabled={!sheetId.trim() || isLoadingSample}
                >
                  {isLoadingSample ? (
                    'Loading...'
                  ) : showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                Map your Google Sheets columns to candidate fields
              </p>
              
              {columnMappings && Object.values(columnMappings).includes('kanban_stage') && (
                <Alert className="mb-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Kanban Stage Mapping:</strong> Use the exact stage names from your hiring pipeline. Available stages: {hiringStages?.map(stage => stage.name).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                {sampleColumns.map((column) => (
                  <div key={column} className="flex items-center gap-2">
                    <Input
                      value={column}
                      readOnly
                      className="flex-1"
                      placeholder="Column name"
                    />
                    <Select
                      value={columnMappings[column] || ''}
                      onValueChange={(value) => updateColumnMapping(column, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select field to map to" />
                      </SelectTrigger>
                      <SelectContent>
                        {CANDIDATE_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeColumnMapping(column)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {showPreview && (
                <ColumnMappingPreview
                  sampleData={sampleData}
                  columnMappings={columnMappings}
                  className="mt-4"
                />
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePreview}
                disabled={!sheetId.trim() || !Object.keys(columnMappings).length || isPreviewLoading}
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  'Generate Preview & Sync'
                )}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!sheetId.trim() || !Object.keys(columnMappings).length}
                >
                  Create Integration Only
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <GoogleSheetsPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        candidates={previewData}
        onSync={handleSyncFromPreview}
        isLoading={syncProgress?.status === 'syncing'}
        syncProgress={syncProgress}
      />
    </>
  );
};