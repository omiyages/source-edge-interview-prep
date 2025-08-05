
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateGoogleSheetsIntegration } from '@/hooks/useGoogleSheetsIntegration';
import { useHiringStages } from '@/hooks/useKanbanData';
import { useGoogleSheetsSample } from '@/hooks/useGoogleSheetsSample';
import { ColumnMappingPreview } from './ColumnMappingPreview';
import { InfoIcon, Eye, EyeOff } from 'lucide-react';

interface GoogleSheetsIntegration {
  id: string;
  sheet_id: string;
  sheet_name: string | null;
  range_specification: string;
  column_mappings: Record<string, string>;
  last_sync_at: string | null;
  is_active: boolean;
}

interface EditColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: GoogleSheetsIntegration;
}

interface ColumnMappingItem {
  id: string;
  columnName: string;
  fieldMapping: string;
}

const COLUMN_MAPPING_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'linkedin_profile', label: 'LinkedIn Profile' },
  { value: 'current_company', label: 'Current Company' },
  { value: 'phone_number', label: 'Phone Number' },
  { value: 'years_of_experience', label: 'Years of Experience' },
  { value: 'salary', label: 'Salary' },
  { value: 'skillsets', label: 'Skills (comma-separated)' },
  { value: 'past_companies', label: 'Past Companies (comma-separated)' },
  { value: 'general_notes', label: 'General Notes' },
  { value: 'applied_company', label: 'Applied Company' },
  { value: 'applied_job_title', label: 'Applied Job Title' },
  { value: 'is_active', label: 'Active Status (Yes/No)' },
  { value: 'kanban_stage', label: 'Kanban Stage' },
];

export const EditColumnMappingDialog: React.FC<EditColumnMappingDialogProps> = ({
  open,
  onOpenChange,
  integration,
}) => {
  const [sheetName, setSheetName] = useState('');
  const [range, setRange] = useState('A:Z');
  const [columnMappings, setColumnMappings] = useState<ColumnMappingItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const updateIntegration = useUpdateGoogleSheetsIntegration();
  const { data: hiringStages } = useHiringStages();
  const { sampleData, isLoading: isLoadingSample, fetchSampleData } = useGoogleSheetsSample();

  useEffect(() => {
    if (integration && open) {
      setSheetName(integration.sheet_name || '');
      setRange(integration.range_specification || 'A:Z');
      
      // Convert Record<string, string> to ColumnMappingItem[]
      const mappingItems = Object.entries(integration.column_mappings || {}).map(([columnName, fieldMapping], index) => ({
        id: `${columnName}-${index}`,
        columnName,
        fieldMapping,
      }));
      setColumnMappings(mappingItems);
    }
  }, [integration, open]);

  const handleSubmit = () => {
    // Convert ColumnMappingItem[] back to Record<string, string>
    const mappingsRecord = columnMappings.reduce((acc, item) => {
      if (item.columnName.trim()) {
        acc[item.columnName] = item.fieldMapping;
      }
      return acc;
    }, {} as Record<string, string>);

    updateIntegration.mutate({
      id: integration.id,
      sheet_name: sheetName || null,
      range_specification: range,
      column_mappings: mappingsRecord,
    });

    onOpenChange(false);
  };

  const handlePreviewToggle = () => {
    if (!showPreview && integration.sheet_id) {
      fetchSampleData(integration.sheet_id, sheetName, 'A1:Z10');
    }
    setShowPreview(!showPreview);
  };

  const addColumnMapping = () => {
    const existingNumbers = columnMappings
      .map(item => item.columnName.match(/^Column (\d+)$/))
      .filter(match => match !== null)
      .map(match => parseInt(match![1]));
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newColumnName = `Column ${nextNumber}`;
    
    const newItem: ColumnMappingItem = {
      id: `new-${Date.now()}-${Math.random()}`,
      columnName: newColumnName,
      fieldMapping: '',
    };
    
    setColumnMappings(prev => [...prev, newItem]);
  };

  const updateColumnName = (id: string, newColumnName: string) => {
    setColumnMappings(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, columnName: newColumnName }
          : item
      )
    );
  };

  const updateColumnMapping = (id: string, fieldMapping: string) => {
    setColumnMappings(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, fieldMapping }
          : item
      )
    );
  };

  const removeColumnMapping = (id: string) => {
    setColumnMappings(prev => prev.filter(item => item.id !== id));
  };

  const hasKanbanStageMapping = columnMappings.some(item => item.fieldMapping === 'kanban_stage');

  // Convert ColumnMappingItem[] to Record<string, string> for preview
  const columnMappingsRecord = columnMappings.reduce((acc, item) => {
    if (item.columnName.trim()) {
      acc[item.columnName] = item.fieldMapping;
    }
    return acc;
  }, {} as Record<string, string>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Column Mapping</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="sheetName">Sheet Name (Optional)</Label>
            <Input
              id="sheetName"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="e.g., 'Candidates' or leave blank for default"
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
                disabled={!integration.sheet_id || isLoadingSample}
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
            
            {hasKanbanStageMapping && (
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Kanban Stage Mapping:</strong> Use the exact stage names from your hiring pipeline. Available stages: {hiringStages?.map(stage => stage.name).join(', ')}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              {columnMappings.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    value={item.columnName}
                    onChange={(e) => updateColumnName(item.id, e.target.value)}
                    placeholder="Sheet column name"
                    className="flex-1"
                  />
                  <Select
                    value={item.fieldMapping}
                    onValueChange={(value) => updateColumnMapping(item.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_MAPPING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeColumnMapping(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addColumnMapping}
                className="mt-2"
              >
                Add Column Mapping
              </Button>
            </div>
          </div>

          {showPreview && (
            <ColumnMappingPreview
              sampleData={sampleData}
              columnMappings={columnMappingsRecord}
              className="mt-4"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateIntegration.isPending}>
            {updateIntegration.isPending ? 'Updating...' : 'Update Integration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
