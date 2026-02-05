import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CreateUserForm } from './CreateUserForm';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex justify-center p-4">
          <CreateUserForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;


