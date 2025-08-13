
// ABOUTME: Dialog for editing Google Sheets column mappings with Live status support
// ABOUTME: Allows users to map spreadsheet columns to candidate fields including live status

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateGoogleSheetsIntegration } from '@/hooks/useGoogleSheetsIntegration';

interface EditColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: any;
}

const CANDIDATE_FIELDS = [
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone_number', label: 'Phone Number' },
  { value: 'linkedin_profile', label: 'LinkedIn Profile' },
  { value: 'current_company', label: 'Current Company' },
  { value: 'years_of_experience', label: 'Years of Experience' },
  { value: 'salary', label: 'Salary' },
  { value: 'skillsets', label: 'Skills (comma-separated)' },
  { value: 'past_companies', label: 'Past Companies (comma-separated)' },
  { value: 'general_notes', label: 'General Notes' },
  { value: 'is_active', label: 'Live Status (Yes/No)' },
];

const COMMON_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const EditColumnMappingDialog: React.FC<EditColumnMappingDialogProps> = ({
  open,
  onOpenChange,
  integration,
}) => {
  const [mappings, setMappings] = useState(integration.column_mappings || {});
  const updateMutation = useUpdateGoogleSheetsIntegration();

  const handleMappingChange = (column: string, field: string) => {
    setMappings(prev => ({
      ...prev,
      [column]: field,
    }));
  };

  const handleRemoveMapping = (column: string) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[column];
      return newMappings;
    });
  };

  const handleAddMapping = () => {
    const availableColumns = COMMON_COLUMNS.filter(col => !mappings[col]);
    if (availableColumns.length > 0) {
      setMappings(prev => ({
        ...prev,
        [availableColumns[0]]: '',
      }));
    }
  };

  const handleSave = () => {
    // Filter out empty mappings
    const validMappings = Object.fromEntries(
      Object.entries(mappings).filter(([_, field]) => field)
    );

    updateMutation.mutate({
      id: integration.id,
      column_mappings: validMappings,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Column Mappings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Map spreadsheet columns to candidate fields. The "Live Status" field should contain "Yes" for active candidates and "No" for inactive ones.
          </p>

          <div className="space-y-3">
            {Object.entries(mappings).map(([column, field]) => (
              <div key={column} className="flex items-center gap-2">
                <Label className="w-20">Column {column}:</Label>
                <Select
                  value={field as string}
                  onValueChange={(value) => handleMappingChange(column, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- No mapping --</SelectItem>
                    {CANDIDATE_FIELDS.map((candidateField) => (
                      <SelectItem key={candidateField.value} value={candidateField.value}>
                        {candidateField.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMapping(column)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleAddMapping}>
              Add Column Mapping
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
