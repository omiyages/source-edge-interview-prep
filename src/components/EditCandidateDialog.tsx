
// ABOUTME: Dialog component for editing user profile information
// ABOUTME: Provides inline editing capabilities for user data including role assignment

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clerkSupabaseClient } from '@/lib/clerk';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/user';
import { Edit } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface EditCandidateDialogProps {
  candidate: UserProfile;
  onUpdate: () => void;
}

export const EditCandidateDialog: React.FC<EditCandidateDialogProps> = ({
  candidate,
  onUpdate
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: candidate.full_name || '',
    email: candidate.email || '',
    role: (candidate.role as 'user' | 'admin') || 'user'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Role should be managed via the secure role workflow (AdminRoleManager).
      // Use the Clerk-authenticated Supabase client so RLS policies evaluate as admin.
      const updateData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
      };

      const { data, error } = await clerkSupabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', candidate.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Update was blocked (no rows updated). Check admin permissions / RLS.");
      }

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit_full_name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter full name"
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit_email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="edit_email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className="mt-1"
              required
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Role is managed from the shield icon action (secure role update).
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
