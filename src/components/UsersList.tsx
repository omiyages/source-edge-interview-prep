
// ABOUTME: Component for displaying a list of users/candidates in a table format
// ABOUTME: Provides admin interface for managing user accounts and candidates

import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserTableRow } from './UserTableRow';
import { useOptimizedUsers } from '@/hooks/useOptimizedUsers';

export const UsersList: React.FC = () => {
  const { data: users, isLoading, refetchUsers } = useOptimizedUsers();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow 
              key={user.id} 
              user={user} 
              onUpdate={refetchUsers}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
