
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateGoogleSheetsIntegration } from '@/hooks/useGoogleSheetsIntegration';
import { useHiringStages } from '@/hooks/useKanbanData';
import { InfoIcon } from 'lucide-react';

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
  { value: 'kanban_stage', label: 'Kanban Stage' },
];

export const EditColumnMappingDialog: React.FC<EditColumnMappingDialogProps> = ({
  open,
  onOpenChange,
  integration,
}) => {
  const [sheetName, setSheetName] = useState('');
  const [range, setRange] = useState('A:Z');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  const updateIntegration = useUpdateGoogleSheetsIntegration();
  const { data: hiringStages } = useHiringStages();

  useEffect(() => {
    if (integration && open) {
      setSheetName(integration.sheet_name || '');
      setRange(integration.range_specification || 'A:Z');
      setColumnMappings(integration.column_mappings || {});
    }
  }, [integration, open]);

  const handleSubmit = () => {
    updateIntegration.mutate({
      id: integration.id,
      sheet_name: sheetName || null,
      range_specification: range,
      column_mappings: columnMappings,
    });

    onOpenChange(false);
  };

  const addColumnMapping = () => {
    const existingColumns = Object.keys(columnMappings);
    const newColumn = `Column ${existingColumns.length + 1}`;
    setColumnMappings(prev => ({
      ...prev,
      [newColumn]: '',
    }));
  };

  const updateColumnName = (oldColumnName: string, newColumnName: string) => {
    if (oldColumnName === newColumnName) return;
    
    const newMappings = { ...columnMappings };
    const mappingValue = newMappings[oldColumnName];
    delete newMappings[oldColumnName];
    newMappings[newColumnName] = mappingValue;
    setColumnMappings(newMappings);
  };

  const updateColumnMapping = (column: string, mapping: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [column]: mapping,
    }));
  };

  const removeColumnMapping = (column: string) => {
    setColumnMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[column];
      return newMappings;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
            <Label>Column Mappings</Label>
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
              {Object.keys(columnMappings).map((column) => (
                <div key={column} className="flex items-center gap-2">
                  <Input
                    value={column}
                    onChange={(e) => updateColumnName(column, e.target.value)}
                    placeholder="Sheet column name"
                    className="flex-1"
                  />
                  <Select
                    value={columnMappings[column] || ''}
                    onValueChange={(value) => updateColumnMapping(column, value)}
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
                    onClick={() => removeColumnMapping(column)}
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
