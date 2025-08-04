import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CompanySelect, JobTitleSelect } from '@/components/ui/company-job-select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Save,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditCandidateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
  onSave?: () => void;
  onDelete?: () => void;
}

export const EditCandidateDetailDialog = ({ 
  open, 
  onOpenChange, 
  candidate,
  onSave,
  onDelete
}: EditCandidateDetailDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: candidate?.full_name || '',
    email: candidate?.email || '',
    phone_number: candidate?.phone_number || '',
    linkedin_profile: candidate?.linkedin_profile || '',
    current_company: candidate?.current_company || '',
    years_of_experience: candidate?.years_of_experience || '',
    salary: candidate?.salary || '',
    skillsets: candidate?.skillsets?.join(', ') || '',
    past_companies: candidate?.past_companies?.join(', ') || '',
    general_notes: candidate?.general_notes || '',
    applied_company: candidate?.applied_company || '',
    applied_job_title: candidate?.applied_job_title || ''
  });

  const queryClient = useQueryClient();

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update candidate basic info
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({
          full_name: data.full_name,
          email: data.email,
          phone_number: data.phone_number,
          linkedin_profile: data.linkedin_profile,
          current_company: data.current_company,
          years_of_experience: data.years_of_experience ? parseInt(data.years_of_experience) : null,
          salary: data.salary ? parseInt(data.salary) : null,
          skillsets: data.skillsets ? data.skillsets.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
          past_companies: data.past_companies ? data.past_companies.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
          general_notes: data.general_notes
        })
        .eq('id', candidate.id);

      if (candidateError) throw candidateError;

      // Update pipeline info if candidate is in pipeline
      if (candidate.pipeline_id) {
        const { error: pipelineError } = await supabase
          .from('candidate_pipeline')
          .update({
            applied_company: data.applied_company,
            applied_job_title: data.applied_job_title
          })
          .eq('id', candidate.pipeline_id);

        if (pipelineError) throw pipelineError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate updated successfully');
      onSave?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update candidate: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ candidateId }: { candidateId: string }) => {
      // First remove from pipeline if exists
      const { error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .delete()
        .eq('candidate_id', candidateId);

      if (pipelineError) {
        console.error('Error removing candidate from pipeline:', pipelineError);
      }

      // Then delete the candidate
      const { error: candidateError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (candidateError) {
        throw candidateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate deleted successfully');
      onDelete?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete candidate: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDeleteCandidate = () => {
    deleteMutation.mutate({ candidateId: candidate.id });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!candidate) return null;

  const isUser = candidate.is_user || candidate.user_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Edit Candidate
              {!isUser && (
                <Badge variant="secondary" className="ml-2">
                  Candidate
                </Badge>
              )}
              {isUser && (
                <Badge variant="default" className="ml-2">
                  User
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="mr-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this candidate? This action cannot be undone.
                      This will permanently remove the candidate from the system and any pipeline data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCandidate}
                      disabled={deleteMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
                <Input
                  id="linkedin_profile"
                  value={formData.linkedin_profile}
                  onChange={(e) => handleInputChange('linkedin_profile', e.target.value)}
                  placeholder="Enter LinkedIn URL"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Professional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_company">Current Company</Label>
                <Input
                  id="current_company"
                  value={formData.current_company}
                  onChange={(e) => handleInputChange('current_company', e.target.value)}
                  placeholder="Enter current company"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={formData.years_of_experience}
                  onChange={(e) => handleInputChange('years_of_experience', e.target.value)}
                  placeholder="Enter years of experience"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="Enter salary"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skillsets">Skills (comma-separated)</Label>
              <Input
                id="skillsets"
                value={formData.skillsets}
                onChange={(e) => handleInputChange('skillsets', e.target.value)}
                placeholder="Enter skills separated by commas"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="past_companies">Past Companies (comma-separated)</Label>
              <Input
                id="past_companies"
                value={formData.past_companies}
                onChange={(e) => handleInputChange('past_companies', e.target.value)}
                placeholder="Enter past companies separated by commas"
              />
            </div>
          </div>

          <Separator />

          {/* Application Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Application Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applied_company">Applied Company</Label>
                <CompanySelect
                  value={formData.applied_company}
                  onChange={(value) => handleInputChange('applied_company', value)}
                  placeholder="Select company they applied to"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="applied_job_title">Applied Job Title</Label>
                <JobTitleSelect
                  value={formData.applied_job_title}
                  onChange={(value) => handleInputChange('applied_job_title', value)}
                  company={formData.applied_company}
                  placeholder="Select job title they applied for"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Notes</h3>
            
            <div className="space-y-2">
              <Label htmlFor="general_notes">General Notes</Label>
              <Textarea
                id="general_notes"
                value={formData.general_notes}
                onChange={(e) => handleInputChange('general_notes', e.target.value)}
                placeholder="Enter any additional notes about the candidate"
                rows={4}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};