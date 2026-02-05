import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KanbanUser } from '@/types/kanban';

interface RoleOption {
  value: string;
  label: string;
}

interface CompanyOption {
  value: string;
  label: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: KanbanUser | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onUserUpdated,
  user
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Load options when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(user.position || '');
      setSelectedCompany(user.company || '');
      loadRoleOptions();
      loadCompanyOptions();
    }
  }, [isOpen, user]);

  const loadRoleOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('value')
        .eq('field_name', 'role')
        .order('value');

      if (error) {
        console.error('Error loading role options:', error);
        toast({
          title: "Error",
          description: `Failed to load role options: ${error.message}`,
          variant: "destructive",
        });
      } else {
        const options = data?.map(item => ({
          value: item.value,
          label: item.value
        })) || [];
        setRoleOptions(options);
      }
    } catch (error) {
      console.error('Unexpected error loading role options:', error);
    }
  };

  const loadCompanyOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('value')
        .eq('field_name', 'company')
        .order('value');

      if (error) {
        console.error('Error loading company options:', error);
        toast({
          title: "Error",
          description: `Failed to load company options: ${error.message}`,
          variant: "destructive",
        });
      } else {
        const options = data?.map(item => ({
          value: item.value,
          label: item.value
        })) || [];
        setCompanyOptions(options);
      }
    } catch (error) {
      console.error('Unexpected error loading company options:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!user || !selectedRole || !selectedCompany) {
      toast({
        title: "Missing Information",
        description: "Please select both a role and company.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Update user's position and company in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          position: selectedRole,
          company: selectedCompany,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.user_id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        toast({
          title: "Error",
          description: "Failed to update user information. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${user.email} has been updated with position: ${selectedRole} at ${selectedCompany}`,
      });

      onUserUpdated();
      onClose();

    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit User Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {formatDate(user.last_activity_at)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Update Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="role-select">Select a new role for this user</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This position will be assigned to the user and displayed on their kanban card.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Update Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="company-select">Select a new company for this user</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This company will be associated with the user and displayed on their kanban card.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Information Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Updated Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{user.role}</Badge>
                  {selectedRole && (
                    <Badge variant="outline" className="ml-2">
                      → {selectedRole}
                    </Badge>
                  )}
                  {selectedCompany && (
                    <Badge variant="outline" className="ml-2">
                      @ {selectedCompany}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={!selectedRole || !selectedCompany || submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
