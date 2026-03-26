
// ABOUTME: Secure user table row component with enhanced security controls
// ABOUTME: Uses secure role management and proper input validation

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { UserProfile } from '@/types/user';
import { EditCandidateDialog } from './EditCandidateDialog';
import { AdminRoleManager } from './AdminRoleManager';
import { AssignJobsPanel } from './AssignJobsPanel';
import { useDeleteUser } from '@/hooks/useDeleteUser';
import { Trash2, Shield, Lock, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserTableRowProps {
  user: UserProfile;
  onUpdate: () => void;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({ user, onUpdate }) => {
  const deleteUserMutation = useDeleteUser();
  const { user: currentUser } = useAuth();
  const [assignJobsOpen, setAssignJobsOpen] = useState(false);

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
            <div title="Admin privileges">
              <Lock className="w-3 h-3 text-red-500" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.is_active ? 'default' : 'secondary'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {user.last_login_at 
          ? new Date(user.last_login_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Never'
        }
      </TableCell>
      <TableCell className="text-sm">
        {user.total_session_time_minutes 
          ? `${Math.round(user.total_session_time_minutes / 60)}h ${user.total_session_time_minutes % 60}m`
          : '0h 0m'
        }
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <EditCandidateDialog candidate={user} onUpdate={onUpdate} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignJobsOpen(true)}
            title="Assign jobs to this candidate"
          >
            <Briefcase className="w-4 h-4" />
          </Button>
          <div title={isSelfEdit ? "Cannot modify your own role" : "Manage user role"}>
            <AdminRoleManager 
              user={user} 
              trigger={
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isSelfEdit}
                >
                  <Shield className="w-4 h-4" />
                  {isSelfEdit && <Lock className="w-3 h-3 ml-1" />}
                </Button>
              }
            />
          </div>
          <div title={isSelfEdit ? "Cannot delete your own account" : "Delete user"}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending || isSelfEdit}
            >
              <Trash2 className="w-4 h-4" />
              {isSelfEdit && <Lock className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>
      </TableCell>
      <AssignJobsPanel
        open={assignJobsOpen}
        onOpenChange={setAssignJobsOpen}
        candidateId={user.id}
        candidateName={user.full_name || user.email}
      />
    </TableRow>
  );
};
