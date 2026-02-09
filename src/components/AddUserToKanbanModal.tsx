import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
  total_session_time_minutes: number | null;
}

interface RoleOption {
  value: string;
  label: string;
}

interface CompanyOption {
  value: string;
  label: string;
}

interface AddUserToKanbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export const AddUserToKanbanModal: React.FC<AddUserToKanbanModalProps> = ({
  isOpen,
  onClose,
  onUserAdded
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Load role and company options from dropdown_options table
  useEffect(() => {
    if (isOpen) {
      loadRoleOptions();
      loadCompanyOptions();
      loadUsers();
    }
  }, [isOpen]);

  const loadRoleOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('value')
        .eq('field_name', 'role')
        .order('value');

      if (error) {
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
      // Silently handle
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
      // Silently handle
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, position, created_at, last_login_at, total_session_time_minutes')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to load users: ${error.message}`,
          variant: "destructive",
        });
      } else {
        setUsers(data || []);
        
        // If no users found, show a helpful message
        if (!data || data.length === 0) {
          toast({
            title: "No Users Found",
            description: "No users found in the database. You may need to create some users first or check your database connection.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      // Silently handle
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchLower))
    );
  });

  const handleAddUser = async () => {
    if (!selectedUser || !selectedRole || !selectedCompany) {
      toast({
        title: "Missing Information",
        description: "Please select a user, assign a role, and select a company.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Check if user is already in the kanban board
      const { data: existingStage, error: checkError } = await supabase
        .from('user_stages')
        .select('id')
        .eq('user_id', selectedUser.id)
        .eq('is_active', true)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        toast({
          title: "Error",
          description: "Failed to check if user already exists in kanban.",
          variant: "destructive",
        });
        return;
      }

      if (existingStage) {
        toast({
          title: "User Already in Kanban",
          description: "This user is already in the kanban board.",
          variant: "destructive",
        });
        return;
      }

      // Update user's position and company in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          position: selectedRole,
          company: selectedCompany,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to update user position. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Add user to kanban board (Interested stage)
      const { error: kanbanError } = await supabase.rpc('move_user_to_stage', {
        p_user_id: selectedUser.id,
        p_new_stage_name: 'Interested',
        p_transitioned_by: currentUser?.id,
        p_notes: `User added to kanban board with position: ${selectedRole}`
      });

      if (kanbanError) {
        toast({
          title: "Error",
          description: `Failed to add user to kanban board: ${kanbanError.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedUser.email} has been added to the kanban board with position: ${selectedRole} at ${selectedCompany}`,
      });

      onUserAdded();
      onClose();
      setSelectedUser(null);
      setSelectedRole('');
      setSelectedCompany('');
      setSearchTerm('');

    } catch (error) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add User to Kanban Board
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pb-20">
          {/* Search and User Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Select User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? 'No users match your search' : 'No users found in database'}
                    {!searchTerm && (
                      <div className="mt-2 text-xs">
                        You may need to create users first or check your database connection.
                      </div>
                    )}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {user.full_name || 'No name'}
                              <Badge variant="secondary" className="text-xs">
                                {user.position && user.position.length > 6 ? `${user.position.substring(0, 6)}...` : user.position || 'No position'}
                              </Badge>
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {formatDate(user.created_at)}
                              {user.last_login_at && (
                                <span className="ml-2">• Last login: {formatDate(user.last_login_at)}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Assign Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="role-select">Select a role for this user</Label>
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
              <CardTitle className="text-sm font-medium">Assign Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="company-select">Select a company for this user</Label>
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

          {/* Selected User Summary */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Selected User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.full_name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{selectedUser.role}</Badge>
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
          )}

          {/* Action Buttons - Sticky at bottom */}
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!selectedUser || !selectedRole || !selectedCompany || submitting}
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Kanban
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
