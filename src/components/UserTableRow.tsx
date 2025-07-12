
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, Calendar, Clock, Edit, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserProfile } from "@/types/user";
import { formatDate, formatDuration } from "@/utils/formatters";

interface UserTableRowProps {
  user: UserProfile;
  onDelete: (userId: string) => void;
  isDeleting: boolean;
  onEdit: (user: UserProfile) => void;
}

export const UserTableRow = ({ user, onDelete, isDeleting, onEdit }: UserTableRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {user.full_name || "N/A"}
          {user.linkedin_profile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => window.open(user.linkedin_profile!, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell className="max-w-[150px] truncate">
        {user.current_company || "N/A"}
      </TableCell>
      <TableCell>
        {user.years_of_experience ? `${user.years_of_experience} years` : "N/A"}
      </TableCell>
      <TableCell className="max-w-[200px]">
        {user.skillsets && user.skillsets.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {user.skillsets.slice(0, 2).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {user.skillsets.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{user.skillsets.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          "N/A"
        )}
      </TableCell>
      <TableCell>
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.is_active ? 'default' : 'destructive'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {user.role !== 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {user.email}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(user.id)}
                    className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
