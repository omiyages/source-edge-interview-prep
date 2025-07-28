
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
      // Get current session for admin function call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      // Create auth user account via admin function
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-user-management', {
        body: {
          email: email,
          fullName: candidate.full_name,
          role: 'user'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        toast.error('Failed to create user account: ' + authError.message);
        return;
      }

      if (!authData?.user?.id) {
        throw new Error('No user ID returned from user creation');
      }

      // Update the candidate record to link to the new user
      const { error: linkError } = await supabase
        .from('candidates')
        .update({ 
          email: email,
          is_user: true,
          user_id: authData.user.id
        })
        .eq('id', candidate.id);

      if (linkError) {
        console.error('Error linking candidate to user:', linkError);
        toast.error('Failed to link candidate to user account');
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
