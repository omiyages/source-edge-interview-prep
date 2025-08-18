
// ABOUTME: Component for rendering individual user/candidate rows in admin tables
// ABOUTME: Displays user information and provides action buttons for management

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { UserProfile } from '@/types/user';
import { EditCandidateDialog } from './EditCandidateDialog';
import { AdminRoleManager } from './AdminRoleManager';
import { useDeleteUser } from '@/hooks/useDeleteUser';
import { Trash2, Shield } from 'lucide-react';

interface UserTableRowProps {
  user: UserProfile;
  onUpdate: () => void;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({ user, onUpdate }) => {
  const { deleteUser } = useDeleteUser();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name || user.email}?`)) {
      deleteUser.mutate(user.id, {
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

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.full_name || 'No name provided'}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role}
        </Badge>
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
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4" />
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteUser.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
