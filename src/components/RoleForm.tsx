import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRole, updateRole, generateRoleSummary } from '@/services/rolesService';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import type { Role, RoleFormData, WorkingStyle, RoleStatus } from '@/types/role';
import { Save, Loader2, Plus } from 'lucide-react';

interface RoleFormProps {
  role?: Role | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EMPTY_FORM: RoleFormData = {
  job_title: '',
  company: '',
  location: '',
  working_style: 'Onsite',
  division: '',
  job_description: '',
  requirements: '',
  nice_to_haves: '',
  benefits: '',
  status: 'active',
};

// Labels for the "Add New" dialog per field
const FIELD_LABELS: Record<string, { title: string; label: string; placeholder: string }> = {
  company: { title: 'Add New Company', label: 'Company Name', placeholder: 'e.g. Google' },
  location: { title: 'Add New Location', label: 'Location', placeholder: 'e.g. Tokyo, Japan' },
  division: { title: 'Add New Division', label: 'Division', placeholder: 'e.g. Engineering' },
};

export const RoleForm: React.FC<RoleFormProps> = ({ role, onSuccess, onCancel }) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dropdown options for each field
  const { options: companies, addOption: addCompany } = useDropdownOptions('company');
  const { options: locations, addOption: addLocation } = useDropdownOptions('location');
  const { options: divisions, addOption: addDivision } = useDropdownOptions('division');

  const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);

  // Generic "Add New" dialog state
  const [addDialogField, setAddDialogField] = useState<string | null>(null);
  const [addDialogValue, setAddDialogValue] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);

  useEffect(() => {
    if (role) {
      setForm({
        job_title: role.job_title,
        company: role.company,
        location: role.location,
        working_style: role.working_style,
        division: role.division || '',
        job_description: role.job_description || '',
        requirements: role.requirements || '',
        nice_to_haves: role.nice_to_haves || '',
        benefits: role.benefits || '',
        status: role.status,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [role]);

  const mutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const createdBy = profile?.email || user?.email || 'admin';
      if (role) {
        return updateRole(role.id, data);
      }
      return createRole(data, createdBy);
    },
    onSuccess: (savedRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: role ? 'Role Updated' : 'Role Created',
        description: `The role "${form.job_title}" has been ${role ? 'updated' : 'created'} successfully.`,
      });

      // Fire-and-forget: generate AI summary in the background
      if (savedRole?.id) {
        generateRoleSummary(savedRole.id, /* force */ !!role).then(() => {
          queryClient.invalidateQueries({ queryKey: ['roles'] });
        });
      }

      if (!role) setForm(EMPTY_FORM);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save role.',
        variant: 'destructive',
      });
    },
  });

  const handleChange = (field: keyof RoleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddDialog = (field: string) => {
    setAddDialogField(field);
    setAddDialogValue('');
  };

  const handleAddOption = async () => {
    if (!addDialogField || !addDialogValue.trim()) return;
    setIsAddingOption(true);

    const adders: Record<string, (v: string) => Promise<boolean>> = {
      company: addCompany,
      location: addLocation,
      division: addDivision,
    };

    const success = await adders[addDialogField](addDialogValue);
    if (success) {
      handleChange(addDialogField as keyof RoleFormData, addDialogValue.trim());
      setAddDialogField(null);
      setAddDialogValue('');
    }
    setIsAddingOption(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.job_title.trim()) {
      toast({ title: 'Validation Error', description: 'Job Title is required.', variant: 'destructive' });
      return;
    }
    if (!form.company.trim()) {
      toast({ title: 'Validation Error', description: 'Company is required.', variant: 'destructive' });
      return;
    }
    if (!form.location.trim()) {
      toast({ title: 'Validation Error', description: 'Location is required.', variant: 'destructive' });
      return;
    }

    mutation.mutate(form);
  };

  const dialogMeta = addDialogField ? FIELD_LABELS[addDialogField] : null;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Job Title + Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title *</Label>
            <Input
              id="job_title"
              placeholder="e.g. Software Engineer"
              value={form.job_title}
              onChange={(e) => handleChange('job_title', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Company *</Label>
            <div className="flex gap-2">
              <Select value={form.company} onValueChange={(v) => handleChange('company', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((comp) => (
                    <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openAddDialog('company')} className="h-9 w-9 shrink-0" title="Add new company">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: Location + Working Style + Division */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="flex gap-2">
              <Select value={form.location} onValueChange={(v) => handleChange('location', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openAddDialog('location')} className="h-9 w-9 shrink-0" title="Add new location">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Working Style *</Label>
            <Select
              value={form.working_style}
              onValueChange={(v) => handleChange('working_style', v as WorkingStyle)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Division</Label>
            <div className="flex gap-2">
              <Select value={form.division || '__none__'} onValueChange={(v) => handleChange('division', v === '__none__' ? '' : v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {divisions.map((div) => (
                    <SelectItem key={div} value={div}>{div}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openAddDialog('division')} className="h-9 w-9 shrink-0" title="Add new division">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Row 3: Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => handleChange('status', v as RoleStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 4: Job Description */}
        <div className="space-y-2">
          <Label>Job Description</Label>
          <RichTextEditor
            value={form.job_description}
            onChange={(v) => handleChange('job_description', v)}
            placeholder="Describe the role, responsibilities, and expectations..."
          />
        </div>

        {/* Row 5: Requirements */}
        <div className="space-y-2">
          <Label>Requirements</Label>
          <RichTextEditor
            value={form.requirements}
            onChange={(v) => handleChange('requirements', v)}
            placeholder="List the key requirements for this role..."
          />
        </div>

        {/* Row 6: Nice to Haves */}
        <div className="space-y-2">
          <Label>Nice to Haves</Label>
          <RichTextEditor
            value={form.nice_to_haves}
            onChange={(v) => handleChange('nice_to_haves', v)}
            placeholder="Optional qualifications or skills that are a plus..."
          />
        </div>

        {/* Row 7: Benefits */}
        <div className="space-y-2">
          <Label>Benefits</Label>
          <RichTextEditor
            value={form.benefits}
            onChange={(v) => handleChange('benefits', v)}
            placeholder="Health insurance, stock options, remote work, etc..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {role ? 'Update Role' : 'Create Role'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Shared Add New Option Dialog */}
      <Dialog open={!!addDialogField} onOpenChange={(open) => !open && setAddDialogField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMeta?.title || 'Add New Option'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{dialogMeta?.label || 'Value'}</Label>
              <Input
                value={addDialogValue}
                onChange={(e) => setAddDialogValue(e.target.value)}
                placeholder={dialogMeta?.placeholder || 'Enter value...'}
                className="mt-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddOption}
                disabled={isAddingOption || !addDialogValue.trim()}
                className="flex-1"
              >
                {isAddingOption ? 'Adding...' : `Add ${dialogMeta?.label || 'Option'}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogField(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
