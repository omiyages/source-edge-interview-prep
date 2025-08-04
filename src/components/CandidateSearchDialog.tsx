
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Mail, Building2, ExternalLink, Plus, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreateNewCandidateDialog } from './CreateNewCandidateDialog';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
}

interface CandidateSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCandidate: (candidate: Candidate, appliedCompany?: string, appliedJobTitle?: string) => void;
}

export const CandidateSearchDialog: React.FC<CandidateSearchDialogProps> = ({
  open,
  onOpenChange,
  onSelectCandidate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedCompany, setAppliedCompany] = useState('');
  const [appliedJobTitle, setAppliedJobTitle] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [showNewJobInput, setShowNewJobInput] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch available candidates (users who are not in pipeline or admins)
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['available-candidates', searchTerm],
    queryFn: async () => {
      console.log('🔍 Fetching available candidates...');
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error fetching candidates:', error);
        throw error;
      }
      
      console.log('✅ Available candidates loaded:', data?.length || 0);
      return data as Candidate[];
    },
    enabled: open,
  });

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

  const handleSelectCandidate = (candidate: Candidate) => {
    onSelectCandidate(candidate, appliedCompany || undefined, appliedJobTitle || undefined);
    onOpenChange(false);
    setSearchTerm('');
    setAppliedCompany('');
    setAppliedJobTitle('');
    setNewJobTitle('');
    setShowNewJobInput(false);
  };

  const handleAddNewJobTitle = () => {
    if (newJobTitle.trim()) {
      addJobTitleMutation.mutate(newJobTitle.trim());
    }
  };

  const getInitials = (candidate: Candidate) => {
    const displayName = candidate.full_name || candidate.email.split('@')[0];
    return displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Candidate to Pipeline</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Candidate
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search candidates by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Application Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Applied - Company</label>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Applied - Job Title</label>
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

          {/* Results */}
          <div className="flex-1 overflow-y-auto max-h-96 space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading candidates...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No candidates found matching your search.' : 'No available candidates.'}
                </p>
              </div>
            ) : (
              candidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs">
                          {getInitials(candidate)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {candidate.full_name || candidate.email.split('@')[0]}
                          </h4>
                          <div className="flex items-center gap-2">
                            {candidate.linkedin_profile && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(candidate.linkedin_profile!, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleSelectCandidate(candidate)}
                            >
                              Add to Pipeline
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{candidate.email}</span>
                        </div>

                        {candidate.current_company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{candidate.current_company}</span>
                          </div>
                        )}

                        {candidate.years_of_experience && (
                          <div className="text-xs text-muted-foreground mb-2">
                            {candidate.years_of_experience} years experience
                          </div>
                        )}

                        {candidate.skillsets && candidate.skillsets.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidate.skillsets.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skillsets.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                +{candidate.skillsets.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
      
      <CreateNewCandidateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCandidateCreated={() => {
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
};
