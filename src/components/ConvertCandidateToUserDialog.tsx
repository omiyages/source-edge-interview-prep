
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ConvertCandidateToUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
}

export const ConvertCandidateToUserDialog: React.FC<ConvertCandidateToUserDialogProps> = ({
  open,
  onOpenChange,
  candidate
}) => {
  const [email, setEmail] = useState(candidate?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleConvert = async () => {
    if (!email || !password) {
      toast.error('Please provide both email and password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Call the admin user management function to create the user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          method: 'CREATE_USER',
          body: {
            email,
            password,
            full_name: candidate.full_name,
            role: 'user'
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update the candidate record to include the email if it wasn't already set
      if (!candidate.email || candidate.email !== email) {
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ email })
          .eq('id', candidate.id);

        if (updateError) {
          console.error('Error updating candidate email:', updateError);
        }
      }

      toast.success(`User account created successfully for ${candidate.full_name}`);
      
      // Refresh the kanban board data
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Error converting candidate to user:', error);
      toast.error(error.message || 'Failed to create user account');
    } finally {
      setIsLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convert to User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {candidate.full_name}
              </div>
              {candidate.current_company && (
                <div>
                  <span className="font-medium">Company:</span> {candidate.current_company}
                </div>
              )}
              {candidate.phone_number && (
                <div>
                  <span className="font-medium">Phone:</span> {candidate.phone_number}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Creating...' : 'Create User Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
