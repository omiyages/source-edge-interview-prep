
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateSecurePassword } from '@/utils/passwordGenerator';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

interface ConvertCandidateToUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: {
    id: string;
    full_name: string;
    email?: string;
  };
  onSuccess: () => void;
}

export const ConvertCandidateToUserDialog = ({
  open,
  onOpenChange,
  candidate,
  onSuccess,
}: ConvertCandidateToUserDialogProps) => {
  const [email, setEmail] = useState(candidate.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(16);
    setPassword(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      // First, update the candidate profile with the real email
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', candidate.id);

      if (updateError) {
        console.error('Error updating candidate profile:', updateError);
        toast.error('Failed to update candidate profile');
        return;
      }

      // Create auth user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: candidate.full_name,
        },
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        toast.error('Failed to create user account: ' + authError.message);
        return;
      }

      // Update the profile with the auth user ID
      const { error: linkError } = await supabase
        .from('profiles')
        .update({ id: authData.user.id })
        .eq('id', candidate.id);

      if (linkError) {
        console.error('Error linking profile to auth user:', linkError);
        toast.error('Failed to link profile to user account');
        return;
      }

      toast.success('Candidate successfully converted to user');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      
    } catch (error) {
      console.error('Error converting candidate to user:', error);
      toast.error('Failed to convert candidate to user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Candidate to User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="candidate-name">Candidate Name</Label>
            <Input
              id="candidate-name"
              value={candidate.full_name}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Converting...' : 'Convert to User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
