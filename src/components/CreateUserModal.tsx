import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateUserForm } from './CreateUserForm';
import { UserPlus } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create User
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <CreateUserForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;


