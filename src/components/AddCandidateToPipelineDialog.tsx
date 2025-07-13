import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
  past_companies?: string[] | null;
  notes?: string[] | null;
}

interface AddCandidateToPipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onConfirm: (appliedCompany: string, appliedJobTitle: string) => void;
}

export const AddCandidateToPipelineDialog: React.FC<AddCandidateToPipelineDialogProps> = ({
  open,
  onOpenChange,
  candidate,
  onConfirm,
}) => {
  const [appliedCompany, setAppliedCompany] = useState('');
  const [appliedJobTitle, setAppliedJobTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleLinkedinImport = async () => {
    if (!linkedinUrl || !candidate) return;

    setIsImporting(true);
    try {
      const { data: linkedinData, error } = await supabase.functions.invoke('scrape-linkedin', {
        body: { url: linkedinUrl },
      });

      if (error) throw error;

      // Update the candidate profile with LinkedIn data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: linkedinData.name || candidate.full_name,
          current_company: linkedinData.company || candidate.current_company,
          years_of_experience: linkedinData.experience || candidate.years_of_experience,
          skillsets: linkedinData.skills || candidate.skillsets,
          past_companies: linkedinData.pastCompanies || candidate.past_companies,
          linkedin_profile: linkedinUrl,
          notes: [...(candidate.notes || []), linkedinData.note],
        })
        .eq('id', candidate.id);

      if (updateError) throw updateError;

      // Pre-fill the company from LinkedIn data
      setAppliedCompany(linkedinData.company || '');
      
      toast.success('LinkedIn profile data imported successfully');
    } catch (error) {
      console.error('Error importing LinkedIn data:', error);
      toast.error('Failed to import LinkedIn data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirm = () => {
    if (!appliedCompany.trim() || !appliedJobTitle.trim()) {
      toast.error('Please fill in both company and job title');
      return;
    }
    
    onConfirm(appliedCompany.trim(), appliedJobTitle.trim());
    setAppliedCompany('');
    setAppliedJobTitle('');
    setLinkedinUrl('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setAppliedCompany('');
    setAppliedJobTitle('');
    setLinkedinUrl('');
    onOpenChange(false);
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {candidate.full_name || candidate.email} to Pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* LinkedIn Import Section */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile URL (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                disabled={isImporting}
              />
              <Button
                onClick={handleLinkedinImport}
                disabled={!linkedinUrl || isImporting}
                variant="outline"
                size="sm"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Application Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="company">Applied - Company *</Label>
              <Input
                id="company"
                placeholder="e.g., Acme Corporation"
                value={appliedCompany}
                onChange={(e) => setAppliedCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">Applied - Job Title *</Label>
              <Input
                id="job"
                placeholder="e.g., Senior Software Engineer"
                value={appliedJobTitle}
                onChange={(e) => setAppliedJobTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Add to Pipeline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};