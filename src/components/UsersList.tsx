
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/types/auth';

type UserRole = 'user' | 'admin';

interface UserTableRowProps {
  userProfile: Profile;
  onDelete: (userId: string) => void;
  onRoleChange: (userId: string, newRole: string) => void;
  isCurrentUser: boolean;
  isAdmin: boolean;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  userProfile,
  onDelete,
  onRoleChange,
  isCurrentUser,
  isAdmin
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(userProfile.role as UserRole);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(userProfile.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async () => {
    setIsUpdatingRole(true);
    try {
      await onRoleChange(userProfile.id, newRole);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <tr key={userProfile.id} className="border-b">
      <td className="p-2">{userProfile.full_name || 'N/A'}</td>
      <td className="p-2">{userProfile.email}</td>
      <td className="p-2">
        {isAdmin ? (
          <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          userProfile.role
        )}
      </td>
      <td className="p-2">{userProfile.is_active ? 'Active' : 'Inactive'}</td>
      <td className="p-2">{new Date(userProfile.created_at || '').toLocaleDateString()}</td>
      <td className="p-2">
        {isAdmin && (
          <div className="flex gap-2">
            {isCurrentUser ? (
              <span className="text-muted-foreground">You</span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            )}
            {userProfile.role !== newRole && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRoleChange}
                disabled={isUpdatingRole}
              >
                {isUpdatingRole ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

const UsersList = () => {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const queryClient = useQueryClient();

  // Fetch all users
  const { data: allUsers, isLoading: isUsersLoading, error: usersError } = useQuery<Profile[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Fetch all candidates
  const { data: candidatesData, isLoading: isCandidatesLoading, error: candidatesError } = useQuery<any[]>({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching candidates:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('User deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Mutation to update user role
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('User role updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });

  const handleDeleteUser = async (userId: string) => {
    await deleteUserMutation.mutateAsync(userId);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRoleMutation.mutateAsync({ userId, newRole });
  };

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    
    return allUsers.filter(userProfile => {
      const matchesSearch = searchTerm === "" || 
        userProfile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userProfile.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === "all" || userProfile.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [allUsers, searchTerm, selectedRole]);

  // Transform candidates to match UserProfile interface for display
  const transformCandidateToUserProfile = (candidate: any): Profile => {
    return {
      id: candidate.id,
      email: candidate.email || '',
      full_name: candidate.full_name || '',
      role: 'user' as const,
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
      last_login_at: null,
      total_session_time_minutes: 0,
      is_active: candidate.is_active ?? true,
      created_by: null,
    };
  };

  if (isUsersLoading || isCandidatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (usersError || candidatesError) {
    return (
      <div className="text-center text-red-500">
        Error: {usersError?.message || candidatesError?.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Manage Users</h2>
        <Input
          type="search"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users & Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userProfile) => (
                  <UserTableRow
                    key={userProfile.id}
                    userProfile={userProfile}
                    onDelete={() => handleDeleteUser(userProfile.id)}
                    onRoleChange={(userId, newRole) => handleRoleChange(userId, newRole)}
                    isCurrentUser={userProfile.id === user?.id}
                    isAdmin={isAdmin}
                  />
                ))}
                {candidatesData?.filter(candidate => !candidate.is_user).map((candidate) => (
                  <UserTableRow
                    key={`candidate-${candidate.id}`}
                    userProfile={transformCandidateToUserProfile(candidate)}
                    onDelete={() => {}}
                    onRoleChange={() => {}}
                    isCurrentUser={false}
                    isAdmin={isAdmin}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (!candidatesData || candidatesData.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialogs and Modals */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add User</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account.
            </DialogDescription>
          </DialogHeader>
          {/* Add User Form Here */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersList;
