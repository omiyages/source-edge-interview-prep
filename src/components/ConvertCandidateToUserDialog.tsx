
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { Candidate } from '@/hooks/useKanbanData';

interface ConvertCandidateToUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  onSuccess?: () => void;
}

export const ConvertCandidateToUserDialog: React.FC<ConvertCandidateToUserDialogProps> = ({ 
  open, 
  onOpenChange, 
  candidate,
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleConvert = async () => {
    if (!password.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a password',
        variant: 'destructive',
      });
      return;
    }

    if (!candidate.email) {
      toast({
        title: 'Error',
        description: 'Candidate must have an email to be converted to a user',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: candidate.email,
        password: password,
        options: {
          data: {
            full_name: candidate.full_name || '',
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update the profile with candidate data
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: candidate.email,
            full_name: candidate.full_name || '',
            role: 'user',
            current_company: candidate.current_company,
            years_of_experience: candidate.years_of_experience,
            salary: candidate.salary,
            linkedin_profile: candidate.linkedin_profile,
            phone_number: candidate.phone_number,
            past_companies: candidate.past_companies,
            skillsets: candidate.skillsets,
            general_notes: candidate.general_notes,
            is_active: true,
          });

        if (profileError) throw profileError;

        // Update the candidate to mark as user
        const { error: candidateError } = await supabase
          .from('candidates')
          .update({
            is_user: true,
            user_id: data.user.id,
          })
          .eq('id', candidate.id);

        if (candidateError) throw candidateError;

        toast({
          title: 'Success',
          description: 'Candidate has been converted to a user successfully',
        });

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });

        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error converting candidate to user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert candidate to user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convert Candidate to User</DialogTitle>
          <DialogDescription>
            This will create a user account for {candidate.full_name || candidate.email} 
            and transfer all their information to the user profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={candidate.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              value={candidate.full_name || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Initial Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password for the user"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to User'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
