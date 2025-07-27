
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGoogleSheetsIntegration } from '@/hooks/useGoogleSheetsIntegration';

interface GoogleSheetsIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
];

export const GoogleSheetsIntegrationDialog: React.FC<GoogleSheetsIntegrationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [range, setRange] = useState('A:Z');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);

  const createIntegration = useCreateGoogleSheetsIntegration();

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
    setSheetId('');
    setSheetName('');
    setRange('A:Z');
    setColumnMappings({});
    setSampleColumns([]);
  };

  const addColumnMapping = () => {
    const newColumn = `Column ${Object.keys(columnMappings).length + 1}`;
    setSampleColumns([...sampleColumns, newColumn]);
    setColumnMappings({
      ...columnMappings,
      [newColumn]: '',
    });
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
    setSampleColumns(sampleColumns.filter(c => c !== column));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Google Sheets</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="sheetId">Google Sheets ID *</Label>
            <Input
              id="sheetId"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="Enter the Google Sheets ID from the URL"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Found in the URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
            </p>
          </div>

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
            
            <div className="space-y-2">
              {sampleColumns.map((column) => (
                <div key={column} className="flex items-center gap-2">
                  <Input
                    value={column}
                    onChange={(e) => {
                      const newColumns = sampleColumns.map(c => c === column ? e.target.value : c);
                      setSampleColumns(newColumns);
                      const newMappings = { ...columnMappings };
                      newMappings[e.target.value] = newMappings[column];
                      delete newMappings[column];
                      setColumnMappings(newMappings);
                    }}
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
          <Button onClick={handleSubmit} disabled={!sheetId.trim()}>
            Create Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
