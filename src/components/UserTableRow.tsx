
// ABOUTME: Simplified table row component for displaying candidate information
// ABOUTME: Only shows essential fields: name, email, and status

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { UserProfile } from "@/types/user";
import { useCandidateInactive } from "@/hooks/useCandidateInactive";

interface UserTableRowProps {
  user: UserProfile;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onEdit: (user: UserProfile) => void;
}

export const UserTableRow = ({ user, onDelete, isDeleting, onEdit }: UserTableRowProps) => {
  const { toggleCandidateStatus, isLoading: isToggling } = useCandidateInactive();

  const handleToggleStatus = () => {
    toggleCandidateStatus({
      candidateId: user.id,
      isActive: !user.is_active
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.full_name || 'N/A'}
      </TableCell>
      <TableCell>
        {user.email || 'N/A'}
      </TableCell>
      <TableCell>
        <Badge 
          variant={user.is_active ? "default" : "secondary"}
          className="flex items-center gap-1 w-fit"
        >
          {user.is_active ? (
            <>
              <ToggleRight className="w-3 h-3" />
              Active
            </>
          ) : (
            <>
              <ToggleLeft className="w-3 h-3" />
              Inactive
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isToggling}
          >
            {user.is_active ? (
              <ToggleLeft className="w-4 h-4" />
            ) : (
              <ToggleRight className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(user.id)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
