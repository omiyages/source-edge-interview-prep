
// ABOUTME: Component for displaying and managing the list of all candidates
// ABOUTME: Provides CRUD operations and simplified table view for candidate management

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Plus } from "lucide-react";
import { EnhancedUserForm } from "./EnhancedUserForm";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserProfile } from "@/types/user";
import { UserTableRow } from "./UserTableRow";
import { useDeleteUser } from "@/hooks/useDeleteUser";

export const UsersList = () => {
  const deleteUserMutation = useDeleteUser();
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Fetch candidates
  const { data: candidates, isLoading, refetch } = useQuery({
    queryKey: ['admin-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading candidates...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            All Candidates ({candidates?.length || 0})
          </CardTitle>
          <Button 
            onClick={() => setShowUserForm(true)}
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {candidates && candidates.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <UserTableRow
                    key={candidate.id}
                    user={{
                      ...candidate,
                      role: 'candidate',
                      created_at: candidate.created_at,
                      updated_at: candidate.updated_at,
                      last_login_at: null,
                      total_session_time_minutes: null,
                      is_active: (candidate as any).is_active !== null ? (candidate as any).is_active : true
                    } as UserProfile}
                    onDelete={deleteUserMutation.mutate}
                    isDeleting={deleteUserMutation.isPending}
                    onEdit={setEditingUser}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No candidates found</h3>
            <p className="text-gray-500">Candidates will appear here once they are created.</p>
          </div>
        )}
      </CardContent>

      {/* Enhanced User Form Dialog */}
      <Dialog open={showUserForm || !!editingUser} onOpenChange={(open) => {
        if (!open) {
          setShowUserForm(false);
          setEditingUser(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit Candidate' : 'Add New Candidate'}
            </DialogTitle>
          </DialogHeader>
          <EnhancedUserForm
            user={editingUser}
            onSuccess={() => {
              refetch();
              setShowUserForm(false);
              setEditingUser(null);
            }}
            onCancel={() => {
              setShowUserForm(false);
              setEditingUser(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
