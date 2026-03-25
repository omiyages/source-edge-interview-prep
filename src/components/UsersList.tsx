
// ABOUTME: Admin user list with search, pagination, and pending approval queue
// ABOUTME: Shows 20 users per page with name/email search and pending filter toggle

import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserTableRow } from './UserTableRow';
import { CreateUserForm } from './CreateUserForm';
import { useOptimizedUsers } from '@/hooks/useOptimizedUsers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clerkSupabaseClient } from '@/lib/clerk';
import { useToast } from '@/hooks/use-toast';
import { Search, Clock, UserCheck, UserX, ChevronLeft, ChevronRight, UserPlus, RefreshCw } from 'lucide-react';

const USERS_PER_PAGE = 20;

export const UsersList: React.FC = () => {
  const { data: users, isLoading, refetchUsers } = useOptimizedUsers();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncWithClerk = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await clerkSupabaseClient.functions.invoke('clerk-sync');
      if (error) throw error;
      toast({
        title: 'Sync complete',
        description: `Removed ${data.deleted} orphaned profile${data.deleted !== 1 ? 's' : ''}. (${data.orphansFound} found, ${data.scanned} scanned)`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: any) {
      toast({
        title: 'Sync failed',
        description: err?.message ?? 'Could not connect to clerk-sync function.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Approve / reject mutation for pending users
  const approvalMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error } = await clerkSupabaseClient
        .from('profiles')
        .update({
          is_active: approve,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: approve ? 'User Approved' : 'User Rejected',
        description: `The user has been ${approve ? 'approved and can now sign in' : 'rejected'}.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user approval status.',
        variant: 'destructive',
      });
    },
  });

  // Count pending users
  const pendingCount = useMemo(() => {
    return (users || []).filter((u) => !u.is_active).length;
  }, [users]);

  // Filter users by search + pending toggle
  const filteredUsers = useMemo(() => {
    let list = users || [];

    if (showPendingOnly) {
      list = list.filter((u) => !u.is_active);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (u) =>
          (u.full_name || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term)
      );
    }

    return list;
  }, [users, searchTerm, showPendingOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page when filters change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const togglePending = useCallback(() => {
    setShowPendingOnly((prev) => !prev);
    setCurrentPage(1);
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Search + Pending toggle + Create User */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <Button
          variant={showPendingOnly ? 'default' : 'outline'}
          onClick={togglePending}
          className={showPendingOnly ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
        >
          <Clock className="w-4 h-4 mr-2" />
          {pendingCount} Pending User{pendingCount !== 1 ? 's' : ''}
        </Button>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create User
        </Button>
        <Button
          variant="outline"
          onClick={handleSyncWithClerk}
          disabled={isSyncing}
          title="Remove profiles for users deleted from Clerk"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing…' : 'Sync with Clerk'}
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {paginatedUsers.length} of {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        {showPendingOnly && ' (pending approval only)'}
      </p>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          {showPendingOnly ? (
            <>
              <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-semibold text-gray-600">No pending approvals</p>
              <p className="text-sm text-gray-500 mt-1">All user registrations have been processed.</p>
            </>
          ) : (
            <p className="text-gray-500">No users match your search.</p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <UserTableRow user={user} onUpdate={refetchUsers} />
                  {/* Approve/Reject row for inactive (pending) users */}
                  {!user.is_active && (
                    <TableRow className="bg-amber-50 border-t-0">
                      <TableCell colSpan={7}>
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 text-sm text-amber-700">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Pending approval</span>
                            <span className="text-amber-600">
                              — Registered {new Date(user.created_at || '').toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approvalMutation.mutate({ userId: user.id, approve: true })}
                              disabled={approvalMutation.isPending}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => approvalMutation.mutate({ userId: user.id, approve: false })}
                              disabled={approvalMutation.isPending}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-9"
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <CreateUserForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};
