// ABOUTME: Secure dropdown options manager with admin-only creation
// ABOUTME: Provides interface for managing dropdown options with proper authentication

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

interface DropdownOption {
  id: string;
  field_name: string;
  value: string;
  created_by?: string;
  created_at: string;
}

const FIELD_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'role', label: 'Role' },
  { value: 'interview_stage', label: 'Interview Stage' },
  { value: 'category', label: 'Category' },
];

export const SecureDropdownManager: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newOption, setNewOption] = useState({ field_name: '', value: '' });

  // Fetch dropdown options using secure client-side query
  const { data: options, isLoading } = useQuery({
    queryKey: ['dropdown-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('id, field_name, value, created_at')
        .order('field_name', { ascending: true })
        .order('value', { ascending: true });

      if (error) throw error;
      return data as DropdownOption[];
    },
    enabled: !!user,
  });

  // Create new option (admin only)
  const createOption = useMutation({
    mutationFn: async (option: { field_name: string; value: string }) => {
      if (!isAdmin) throw new Error('Admin privileges required');

      const { data, error } = await supabase.functions.invoke('dropdown-options', {
        body: {
          field_name: option.field_name,
          option_value: option.value,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
      setNewOption({ field_name: '', value: '' });
      toast({
        title: "Option created",
        description: "Dropdown option has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create dropdown option.",
        variant: "destructive",
      });
    },
  });

  // Delete option (admin only)
  const deleteOption = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error('Admin privileges required');

      const { error } = await supabase
        .from('dropdown_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
      toast({
        title: "Option deleted",
        description: "Dropdown option has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete dropdown option.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.field_name || !newOption.value.trim()) {
      toast({
        title: "Invalid input",
        description: "Please select a field type and enter a value.",
        variant: "destructive",
      });
      return;
    }
    createOption.mutate(newOption);
  };

  if (!user) {
    return <div>Please log in to manage dropdown options.</div>;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dropdown Options</CardTitle>
          <CardDescription>Admin privileges required to manage dropdown options.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const groupedOptions = options?.reduce((acc, option) => {
    if (!acc[option.field_name]) {
      acc[option.field_name] = [];
    }
    acc[option.field_name].push(option);
    return acc;
  }, {} as Record<string, DropdownOption[]>) || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Dropdown Option</CardTitle>
          <CardDescription>Create new options for dropdown fields (Admin only)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field_name">Field Type</Label>
                <Select
                  value={newOption.field_name}
                  onValueChange={(value) => setNewOption(prev => ({ ...prev, field_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Option Value</Label>
                <Input
                  id="value"
                  value={newOption.value}
                  onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter option value"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={createOption.isPending}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createOption.isPending ? 'Creating...' : 'Add Option'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Options</CardTitle>
          <CardDescription>Manage existing dropdown options</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading options...</div>
          ) : (
            <div className="space-y-4">
              {FIELD_TYPES.map(fieldType => (
                <div key={fieldType.value}>
                  <h4 className="font-medium mb-2">{fieldType.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {groupedOptions[fieldType.value]?.map(option => (
                      <Badge
                        key={option.id}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {option.value}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => deleteOption.mutate(option.id)}
                          disabled={deleteOption.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    )) || <span className="text-muted-foreground text-sm">No options available</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};