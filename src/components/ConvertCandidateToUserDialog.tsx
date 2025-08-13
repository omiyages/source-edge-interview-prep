
// ABOUTME: Dialog component for converting candidates to users in the system
// ABOUTME: Handles the conversion process and user creation workflow

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ConvertCandidateToUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
  onSuccess?: () => void;
}

export const ConvertCandidateToUserDialog: React.FC<ConvertCandidateToUserDialogProps> = ({
  open,
  onOpenChange,
  candidate,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(candidate?.email || '');
  const [fullName, setFullName] = useState(candidate?.full_name || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleConvert = async () => {
    if (!email || !fullName) {
      toast({
        title: 'Error',
        description: 'Please provide both email and full name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create a user profile directly
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: email,
          full_name: fullName,
          current_company: candidate.current_company,
          linkedin_profile: candidate.linkedin_profile,
          phone_number: candidate.phone_number,
          years_of_experience: candidate.years_of_experience,
          salary: candidate.salary,
          skillsets: candidate.skillsets,
          past_companies: candidate.past_companies,
          general_notes: candidate.general_notes,
          role: 'user',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update candidate to mark as user
      await supabase
        .from('candidates')
        .update({ 
          is_user: true,
          user_id: data.id 
        })
        .eq('id', candidate.id);

      toast({
        title: 'Success',
        description: 'Candidate has been converted to a user successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error converting candidate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert candidate to user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to User</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={isLoading}
            >
              {isLoading ? 'Converting...' : 'Convert to User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
