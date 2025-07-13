
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

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
  const [newJobTitle, setNewJobTitle] = useState('');
  const [showNewJobInput, setShowNewJobInput] = useState(false);

  const queryClient = useQueryClient();

  // Fetch companies from interview_questions table for dropdown
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-from-questions'],
    queryFn: async () => {
      console.log('🔍 Fetching companies from interview questions...');
      
      const { data, error } = await supabase
        .from('interview_questions')
        .select('company')
        .not('company', 'is', null);
      
      if (error) {
        console.error('❌ Error fetching companies:', error);
        throw error;
      }
      
      // Get unique companies
      const uniqueCompanies = [...new Set(data.map(question => question.company).filter(Boolean))];
      console.log('✅ Companies loaded:', uniqueCompanies.length);
      return uniqueCompanies as string[];
    },
    enabled: open,
  });

  // Fetch job titles from courses' attached_jobs
  const { data: jobTitles = [] } = useQuery({
    queryKey: ['job-titles-from-courses'],
    queryFn: async () => {
      console.log('🔍 Fetching job titles from courses...');
      
      const { data, error } = await supabase
        .from('courses')
        .select('attached_jobs')
        .not('attached_jobs', 'is', null);
      
      if (error) {
        console.error('❌ Error fetching job titles:', error);
        throw error;
      }
      
      // Flatten all attached_jobs arrays and get unique job titles
      const allJobTitles = data
        .flatMap(course => course.attached_jobs || [])
        .filter(Boolean);
      const uniqueJobTitles = [...new Set(allJobTitles)];
      
      console.log('✅ Job titles loaded:', uniqueJobTitles.length);
      return uniqueJobTitles as string[];
    },
    enabled: open,
  });

  // Mutation to add new job title to courses
  const addJobTitleMutation = useMutation({
    mutationFn: async (newJobTitle: string) => {
      console.log('🔄 Adding new job title to courses:', newJobTitle);
      
      // Get all courses that don't already have this job title
      const { data: courses, error: fetchError } = await supabase
        .from('courses')
        .select('id, attached_jobs');
      
      if (fetchError) throw fetchError;
      
      // Update each course to include the new job title if it's not already there
      const updates = courses?.map(course => {
        const currentJobs = course.attached_jobs || [];
        if (!currentJobs.includes(newJobTitle)) {
          return supabase
            .from('courses')
            .update({
              attached_jobs: [...currentJobs, newJobTitle]
            })
            .eq('id', course.id);
        }
        return null;
      }).filter(Boolean) || [];
      
      // Execute all updates
      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const errors = results.filter(result => result?.error);
        if (errors.length > 0) {
          throw errors[0].error;
        }
      }
      
      console.log('✅ Job title added to courses');
      return newJobTitle;
    },
    onSuccess: (newJobTitle) => {
      queryClient.invalidateQueries({ queryKey: ['job-titles-from-courses'] });
      setAppliedJobTitle(newJobTitle);
      setNewJobTitle('');
      setShowNewJobInput(false);
      toast.success('New job title added successfully');
    },
    onError: (error) => {
      console.error('❌ Error adding job title:', error);
      toast.error('Failed to add new job title');
    },
  });

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
    setNewJobTitle('');
    setShowNewJobInput(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setAppliedCompany('');
    setAppliedJobTitle('');
    setLinkedinUrl('');
    setNewJobTitle('');
    setShowNewJobInput(false);
    onOpenChange(false);
  };

  const handleAddNewJobTitle = () => {
    if (newJobTitle.trim()) {
      addJobTitleMutation.mutate(newJobTitle.trim());
    }
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
              <Select value={appliedCompany} onValueChange={setAppliedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">Applied - Job Title *</Label>
              {!showNewJobInput ? (
                <div className="flex gap-2">
                  <Select value={appliedJobTitle} onValueChange={setAppliedJobTitle}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select job title..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.map((jobTitle) => (
                        <SelectItem key={jobTitle} value={jobTitle}>
                          {jobTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewJobInput(true)}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter new job title..."
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddNewJobTitle}
                    disabled={!newJobTitle.trim() || addJobTitleMutation.isPending}
                    size="sm"
                  >
                    {addJobTitleMutation.isPending ? 'Adding...' : 'Add'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewJobInput(false);
                      setNewJobTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
