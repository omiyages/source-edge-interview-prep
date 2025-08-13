
// ABOUTME: Dialog component for editing Google Sheets column mappings
// ABOUTME: Allows users to map spreadsheet columns to candidate fields including live status

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: any;
  onSave: (mappings: Record<string, string>) => void;
}

// Define all available candidate fields
const CANDIDATE_FIELDS = [
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone_number", label: "Phone Number" },
  { value: "linkedin_profile", label: "LinkedIn Profile" },
  { value: "current_company", label: "Current Company" },
  { value: "years_of_experience", label: "Years of Experience" },
  { value: "salary", label: "Salary" },
  { value: "skillsets", label: "Skills" },
  { value: "past_companies", label: "Past Companies" },
  { value: "general_notes", label: "General Notes" },
  { value: "applied_company", label: "Applied Company" },
  { value: "applied_job_title", label: "Applied Job Title" },
  { value: "kanban_stage", label: "Kanban Stage" },
  { value: "is_active", label: "Live Status" }
];

export const EditColumnMappingDialog = ({ open, onOpenChange, integration, onSave }: EditColumnMappingDialogProps) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (integration?.column_mappings) {
      try {
        setMappings(integration.column_mappings);
      } catch (error) {
        console.error("Error parsing column mappings:", error);
        setMappings({});
      }
    } else {
      setMappings({});
    }

    // Generate available columns (A-Z for simplicity)
    const columns = [];
    for (let i = 65; i <= 90; i++) {
      columns.push(String.fromCharCode(i));
    }
    setAvailableColumns(columns);
  }, [integration]);

  const handleMappingChange = (field: string, column: string) => {
    if (column === "unmapped") {
      const newMappings = { ...mappings };
      delete newMappings[field];
      setMappings(newMappings);
    } else {
      setMappings(prev => ({ ...prev, [field]: column }));
    }
  };

  const handleSave = () => {
    onSave(mappings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Column Mappings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Map your Google Sheets columns to candidate fields. Select "Unmapped" to leave a field empty.
          </p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {CANDIDATE_FIELDS.map(field => (
              <div key={field.value} className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium min-w-[150px]">
                  {field.label}
                </Label>
                <Select 
                  value={mappings[field.value] || "unmapped"} 
                  onValueChange={(value) => handleMappingChange(field.value, value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="unmapped" className="text-muted-foreground italic">
                      Unmapped
                    </SelectItem>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        Column {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Mappings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
