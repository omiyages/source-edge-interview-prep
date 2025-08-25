
// ABOUTME: Simplified form component for creating and editing user profiles
// ABOUTME: Includes essential fields: full name, email, and role assignment

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/user';

interface EnhancedUserFormProps {
  user?: UserProfile | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnhancedUserForm: React.FC<EnhancedUserFormProps> = ({
  user,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user' as 'user' | 'admin'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: (user.role as 'user' | 'admin') || 'user'
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        is_active: true
      };

      if (user?.id) {
        // Update existing user profile
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User profile updated successfully",
        });
      } else {
        // Create new user profile (this would typically be handled during auth signup)
        toast({
          title: "Info",
          description: "User profiles are created during the authentication process",
          variant: "default",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter full name"
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-sm font-medium">
              Role *
            </Label>
            <Select value={formData.role} onValueChange={(value: 'user' | 'admin') => handleInputChange('role', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};
