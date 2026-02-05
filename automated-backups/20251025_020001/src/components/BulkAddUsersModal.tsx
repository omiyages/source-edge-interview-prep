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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, UserPlus, CheckCircle, AlertCircle, X, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login_at: string;
  total_session_time_minutes: number;
}

interface BulkUser {
  id: string;
  email: string;
  fullName: string;
  position: string;
  stage: string;
  isValid: boolean;
  error?: string;
}

interface RoleOption {
  value: string;
  label: string;
}

export const BulkAddUsersModal = ({ isOpen, onClose, onUpdate }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [selectedStage, setSelectedStage] = useState('Interested');
  const [stages, setStages] = useState<{ id: string; name: string; order_index: number }[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadStages();
      loadRoleOptions();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, position, last_login_at, total_session_time_minutes')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadStages = async () => {
    try {
      // Use the same stages as KanbanBoard
      const kanbanStages = [
        { id: 'Interested', name: 'Interested', order_index: 1 },
        { id: 'Scheduled', name: 'Scheduled', order_index: 2 },
        { id: 'CV Sent', name: 'CV Sent', order_index: 3 },
        { id: '1st Interview', name: '1st Interview', order_index: 4 },
        { id: '2nd Interview', name: '2nd Interview', order_index: 5 },
        { id: '3rd Interview+', name: '3rd Interview+', order_index: 6 },
        { id: 'Debrief', name: 'Debrief', order_index: 7 },
        { id: 'Offer', name: 'Offer', order_index: 8 },
        { id: 'Offer Accepted', name: 'Offer Accepted', order_index: 9 },
      ];
      setStages(kanbanStages);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const loadRoleOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('value')
        .eq('field_name', 'role')
        .order('value');

      if (error) throw error;
      
      const options = (data || []).map(item => ({
        value: item.value,
        label: item.value
      }));
      setRoleOptions(options);
    } catch (error) {
      console.error('Error loading role options:', error);
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId]);
    } else {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    }
  };

  const updateBulkUsers = () => {
    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    const bulkUsersList: BulkUser[] = selectedUsers.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      position: user.role,
      stage: selectedStage,
      isValid: true
    }));
    console.log('🔍 Bulk users updated with stage:', selectedStage);
    console.log('🔍 Bulk users:', bulkUsersList);
    setBulkUsers(bulkUsersList);
  };

  useEffect(() => {
    updateBulkUsers();
  }, [selectedUserIds, selectedStage]);

  const addBulkUsers = async () => {
    const validUsers = bulkUsers.filter(user => user.isValid);
    
    if (validUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to add to Kanban.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRole) {
      toast({
        title: "No Role Selected",
        description: "Please select a role to assign to all users.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const user of validUsers) {
        try {
          // Add to Kanban stage
          console.log('🔍 Adding user to stage:', user.stage, 'for user:', user.email);
          const { error: kanbanError } = await supabase.rpc('move_user_to_stage', {
            p_user_id: user.id,
            p_new_stage_name: user.stage,
            p_transitioned_by: currentUser?.id,
            p_notes: `Bulk added to ${user.stage} stage`
          });

          if (kanbanError) {
            console.error('Kanban error details:', kanbanError);
            throw kanbanError;
          }

          // Update user's position/role
          const { error: roleError } = await supabase
            .from('profiles')
            .update({
              position: selectedRole
            })
            .eq('id', user.id);

          if (roleError) throw roleError;

          successCount++;
        } catch (error) {
          console.error(`Error adding user ${user.email}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Bulk Users Added",
          description: `Successfully added ${successCount} users to Kanban and assigned role. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        });
        onUpdate();
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to add any users. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in bulk user creation:', error);
      toast({
        title: "Error",
        description: "Failed to add users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBulkUser = (index: number) => {
    const newBulkUsers = bulkUsers.filter((_, i) => i !== index);
    setBulkUsers(newBulkUsers);
    
    // Rebuild bulk text
    const newText = newBulkUsers.map(user => 
      `${user.email}, ${user.fullName}, ${user.position}, ${user.stage}`
    ).join('\n');
    setBulkText(newText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Bulk Add Users to Kanban
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Select users from the list below to add them to the Kanban board.</p>
              <p>• Choose a stage for all selected users</p>
              <p>• Select a role to assign to all users</p>
              <p>• Users will be added to Kanban and assigned the selected role</p>
            </CardContent>
          </Card>

          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select Users ({selectedUserIds.length} selected)</Label>
            <div className="max-h-60 overflow-y-auto border rounded p-3 space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={user.id}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                  />
                  <label htmlFor={user.id} className="flex-1 cursor-pointer">
                    <div className="font-medium flex items-center gap-2">
                      {user.full_name}
                      <Badge variant="secondary" className="text-xs">
                        {user.position && user.position.length > 6 ? `${user.position.substring(0, 6)}...` : user.position || 'No position'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Selection */}
          <div className="space-y-2">
            <Label>Stage for All Users</Label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.name}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role to Assign</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role to assign to all users" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Users Preview */}
          {bulkUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview ({bulkUsers.length} users)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bulkUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.fullName}
                            <Badge variant="secondary" className="text-xs">
                              {user.position && user.position.length > 6 ? `${user.position.substring(0, 6)}...` : user.position || 'No position'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.position} • {user.stage}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={addBulkUsers} 
              disabled={loading || bulkUsers.length === 0 || !selectedRole}
            >
              {loading ? 'Adding Users...' : `Add ${bulkUsers.length} Users to Kanban`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
