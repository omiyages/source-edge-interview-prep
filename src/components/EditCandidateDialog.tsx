
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
  onSave: () => void;
}

export const EditCandidateDialog: React.FC<EditCandidateDialogProps> = ({
  open,
  onOpenChange,
  candidate,
  onSave
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    linkedin_profile: '',
    current_company: '',
    years_of_experience: '',
    salary: '',
    skillsets: '',
    past_companies: '',
    general_notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (candidate) {
      setFormData({
        full_name: candidate.full_name || '',
        email: candidate.email || '',
        phone_number: candidate.phone_number || '',
        linkedin_profile: candidate.linkedin_profile || '',
        current_company: candidate.current_company || '',
        years_of_experience: candidate.years_of_experience?.toString() || '',
        salary: candidate.salary?.toString() || '',
        skillsets: candidate.skillsets?.join(', ') || '',
        past_companies: candidate.past_companies?.join(', ') || '',
        general_notes: candidate.general_notes || ''
      });
    }
  }, [candidate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!candidate?.id) return;
    
    setIsLoading(true);
    try {
      const updateData = {
        full_name: formData.full_name,
        email: formData.email || null, // Allow null for email
        phone_number: formData.phone_number,
        linkedin_profile: formData.linkedin_profile,
        current_company: formData.current_company,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
        salary: formData.salary ? parseInt(formData.salary) : null,
        skillsets: formData.skillsets ? formData.skillsets.split(',').map(s => s.trim()).filter(s => s) : [],
        past_companies: formData.past_companies ? formData.past_companies.split(',').map(s => s.trim()).filter(s => s) : [],
        general_notes: formData.general_notes
      };

      // Update the candidates table, not profiles
      const { error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidate.id);

      if (error) {
        console.error('Error updating candidate:', error);
        toast.error('Failed to update candidate');
      } else {
        toast.success('Candidate updated successfully');
        onSave();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast.error('Failed to update candidate');
    } finally {
      setIsLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Candidate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="full_name" className="text-sm">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address (optional)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone_number" className="text-sm">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedin_profile" className="text-sm">LinkedIn Profile</Label>
                <Input
                  id="linkedin_profile"
                  value={formData.linkedin_profile}
                  onChange={(e) => handleInputChange('linkedin_profile', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="current_company" className="text-sm">Current Company</Label>
                <Input
                  id="current_company"
                  value={formData.current_company}
                  onChange={(e) => handleInputChange('current_company', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="years_of_experience" className="text-sm">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={formData.years_of_experience}
                  onChange={(e) => handleInputChange('years_of_experience', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="salary" className="text-sm">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="skillsets" className="text-sm">Skills (comma-separated)</Label>
                <Input
                  id="skillsets"
                  value={formData.skillsets}
                  onChange={(e) => handleInputChange('skillsets', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="past_companies" className="text-sm">Past Companies (comma-separated)</Label>
                <Input
                  id="past_companies"
                  value={formData.past_companies}
                  onChange={(e) => handleInputChange('past_companies', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="general_notes" className="text-sm">General Notes</Label>
                <Textarea
                  id="general_notes"
                  value={formData.general_notes}
                  onChange={(e) => handleInputChange('general_notes', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
