
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserProfile } from "@/types/user";
import { useAdminRoleManagement } from "@/hooks/useAdminRoleManagement";
import { Shield, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminRoleManagerProps {
  user: UserProfile;
  trigger?: React.ReactNode;
}

export const AdminRoleManager = ({ user, trigger }: AdminRoleManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'user'>(user.role as 'admin' | 'user');
  const [reason, setReason] = useState('');
  const { updateUserRole } = useAdminRoleManagement();

  const handleSubmit = async () => {
    if (newRole === user.role) {
      setIsOpen(false);
      return;
    }

    updateUserRole.mutate(
      { userId: user.id, newRole, reason },
      {
        onSuccess: () => {
          setIsOpen(false);
          setReason('');
        }
      }
    );
  };

  const handleRoleChange = (value: string) => {
    if (value === 'admin' || value === 'user') {
      setNewRole(value);
    }
  };

  const isRoleChange = newRole !== user.role;
  const isPromotingToAdmin = newRole === 'admin' && user.role === 'user';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Manage Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-info">User Information</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              <p className="font-medium">{user.full_name || 'No name'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm">Current Role: <span className="font-medium">{user.role}</span></p>
            </div>
          </div>

          <div>
            <Label htmlFor="new-role">New Role</Label>
            <Select value={newRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isPromotingToAdmin && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Promoting to admin grants full system access including user management and content moderation.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for this role change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateUserRole.isPending || (!isRoleChange && !reason)}
              variant={isRoleChange ? "default" : "ghost"}
            >
              {updateUserRole.isPending ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
