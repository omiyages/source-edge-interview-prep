
// ABOUTME: Secure user table row component with enhanced security controls
// ABOUTME: Uses secure role management and proper input validation

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { UserProfile } from '@/types/user';
import { EditCandidateDialog } from './EditCandidateDialog';
import { AdminRoleManager } from './AdminRoleManager';
import { useDeleteUser } from '@/hooks/useDeleteUser';
import { Trash2, Shield, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserTableRowProps {
  user: UserProfile;
  onUpdate: () => void;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({ user, onUpdate }) => {
  const deleteUserMutation = useDeleteUser();
  const { user: currentUser } = useAuth();

  const handleDelete = () => {
    // Prevent self-deletion
    if (currentUser?.id === user.id) {
      alert('You cannot delete your own account for security reasons.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.full_name || user.email}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id, {
        onSuccess: () => {
          onUpdate();
        }
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isSelfEdit = currentUser?.id === user.id;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.full_name || 'No name provided'}
        {isSelfEdit && (
          <span className="ml-2 text-xs text-blue-600 font-semibold">(You)</span>
        )}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role}
          </Badge>
          {user.role === 'admin' && (
            <Lock className="w-3 h-3 text-red-500" title="Admin privileges" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.is_active ? 'default' : 'secondary'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <EditCandidateDialog candidate={user} onUpdate={onUpdate} />
          <AdminRoleManager 
            user={user} 
            trigger={
              <Button 
                variant="outline" 
                size="sm"
                disabled={isSelfEdit}
                title={isSelfEdit ? "Cannot modify your own role" : "Manage user role"}
              >
                <Shield className="w-4 h-4" />
                {isSelfEdit && <Lock className="w-3 h-3 ml-1" />}
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending || isSelfEdit}
            title={isSelfEdit ? "Cannot delete your own account" : "Delete user"}
          >
            <Trash2 className="w-4 h-4" />
            {isSelfEdit && <Lock className="w-3 h-3 ml-1" />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
