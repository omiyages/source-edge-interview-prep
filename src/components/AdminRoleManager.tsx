
// ABOUTME: Secure admin role manager component with enhanced validation
// ABOUTME: Uses database-level security functions and comprehensive input validation

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserProfile } from "@/types/user";
import { useSecureAdminRoleManagement } from "@/hooks/useSecureAdminRoleManagement";
import { Shield, AlertTriangle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateAndSanitizeReason, validateRole } from "@/utils/secureInputValidation";
import { useAuth } from "@/hooks/useAuth";

interface AdminRoleManagerProps {
  user: UserProfile;
  trigger?: React.ReactNode;
}

export const AdminRoleManager = ({ user, trigger }: AdminRoleManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'user'>(user.role as 'admin' | 'user');
  const [reason, setReason] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { updateUserRole } = useSecureAdminRoleManagement();
  const { user: currentUser } = useAuth();

  const handleSubmit = async () => {
    setValidationErrors([]);

    if (newRole === user.role) {
      setIsOpen(false);
      return;
    }

    // Prevent self role changes (additional UI-level check)
    if (currentUser?.id === user.id) {
      setValidationErrors(['You cannot change your own role for security reasons']);
      return;
    }

    // Validate inputs
    const roleValidation = validateRole(newRole);
    const reasonValidation = validateAndSanitizeReason(reason, currentUser?.id);

    const allErrors = [...roleValidation.errors, ...reasonValidation.errors];

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      return;
    }

    // Require reason for role changes
    if (!reasonValidation.sanitizedValue || reasonValidation.sanitizedValue.trim().length < 10) {
      setValidationErrors(['Please provide a detailed reason for this role change (minimum 10 characters)']);
      return;
    }

    updateUserRole.mutate(
      { 
        userId: user.id, 
        newRole, 
        reason: reasonValidation.sanitizedValue 
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setReason('');
          setValidationErrors([]);
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
  const isSelfEdit = currentUser?.id === user.id;

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
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Secure Role Management
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-info">User Information</Label>
            <div className="mt-1 p-3 bg-neutral-800/50 rounded-md">
              <p className="font-medium">{user.full_name || 'No name'}</p>
              <p className="text-sm text-neutral-400">{user.email}</p>
              <p className="text-sm">Current Role: <span className="font-medium">{user.role}</span></p>
            </div>
          </div>

          {isSelfEdit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You cannot change your own role for security reasons.
              </AlertDescription>
            </Alert>
          )}

          {!isSelfEdit && (
            <>
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
                <Label htmlFor="reason">Reason for Change *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for this role change (minimum 10 characters)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                  required
                />
                <p className="text-xs text-neutral-400 mt-1">
                  This change will be logged for security audit purposes.
                </p>
              </div>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateUserRole.isPending || isSelfEdit}
                  variant={isRoleChange ? "default" : "ghost"}
                >
                  {updateUserRole.isPending ? "Updating Securely..." : "Update Role"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
