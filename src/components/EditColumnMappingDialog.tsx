
// ABOUTME: Dialog component for editing Google Sheets column mappings
// ABOUTME: Allows users to map spreadsheet columns to candidate fields including live status

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const EditColumnMappingDialog = ({ open, onOpenChange, integration, onSave }: EditColumnMappingDialogProps) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (integration?.column_mappings) {
      // Safely parse the column mappings
      try {
        setMappings(integration.column_mappings);
      } catch (error) {
        console.error("Error parsing column mappings:", error);
        toast({
          title: "Error",
          description: "Failed to parse existing column mappings.",
          variant: "destructive",
        });
        setMappings({});
      }
    } else {
      setMappings({});
    }

    // Extract available columns from the range specification
    if (integration?.range_specification) {
      // Assuming the range specification is in the format "A1:Z1"
      const range = integration.range_specification.split(':');
      if (range.length === 2) {
        const startChar = range[0].replace(/\d/g, ''); // Remove digits to get the column letter
        const endChar = range[1].replace(/\d/g, '');

        const columns = [];
        for (let charCode = startChar.charCodeAt(0); charCode <= endChar.charCodeAt(0); charCode++) {
          columns.push(String.fromCharCode(charCode));
        }
        setAvailableColumns(columns);
      }
    }
  }, [integration]);

  const handleMappingChange = (field: string, column: string) => {
    setMappings(prev => ({ ...prev, [field]: column }));
  };

  const handleSave = () => {
    // Convert all mapping values to strings to ensure type safety
    const stringMappings: Record<string, string> = {};
    Object.entries(mappings).forEach(([key, value]) => {
      stringMappings[key] = String(value || '');
    });
    
    onSave(stringMappings);
    onOpenChange(false);
  };

  const candidateFields = [
    "full_name",
    "email",
    "phone_number",
    "linkedin_profile",
    "current_company",
    "years_of_experience",
    "salary",
    "skillsets",
    "past_companies",
    "general_notes",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Edit Column Mappings</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Map your Google Sheets columns to candidate fields. Select "Unmapped" to leave a field empty.
          </p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {candidateFields.map(field => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="text-sm font-medium capitalize">
                  {field.replace(/_/g, ' ')}
                </Label>
                <Select 
                  value={mappings[field] || "unmapped"} 
                  onValueChange={(value) => handleMappingChange(field, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
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
        
        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="min-w-[80px]"
          >
            Save Mappings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
