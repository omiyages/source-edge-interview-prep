import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface JobTitleSelectProps {
  value: string;
  onChange: (value: string) => void;
  company?: string;
  placeholder?: string;
  className?: string;
}

export const CompanySelect = ({ value, onChange, placeholder = "Select company", className }: CompanySelectProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('company')
        .not('company', 'is', null);

      if (error) throw error;
      
      // Get unique companies
      const uniqueCompanies = [...new Set(data.map(course => course.company))].filter(Boolean);
      return uniqueCompanies.sort();
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (company: string) => {
      const { error } = await supabase
        .from('courses')
        .insert({
          company,
          title: `${company} Training Course`,
          description: `Training course for ${company}`,
          attached_jobs: []
        });

      if (error) throw error;
      return company;
    },
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onChange(company);
      setNewCompany('');
      setIsAddingNew(false);
      toast.success('Company added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add company: ${error.message}`);
    },
  });

  const handleAddCompany = () => {
    if (!newCompany.trim()) return;
    createCompanyMutation.mutate(newCompany.trim());
  };

  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="" disabled>Loading companies...</SelectItem>
          ) : (
            <>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
              <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                <DialogTrigger asChild>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent">
                    <Plus className="w-4 h-4" />
                    Add new company
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-company">Company Name</Label>
                      <Input
                        id="new-company"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        placeholder="Enter company name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCompany();
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingNew(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddCompany}
                        disabled={createCompanyMutation.isPending || !newCompany.trim()}
                        className="flex-1"
                      >
                        {createCompanyMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Company
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export const JobTitleSelect = ({ value, onChange, company, placeholder = "Select job title", className }: JobTitleSelectProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const queryClient = useQueryClient();

  const { data: jobTitles = [], isLoading } = useQuery({
    queryKey: ['job-titles', company],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('attached_jobs');

      if (company) {
        query = query.eq('company', company);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Get unique job titles from all attached_jobs arrays
      const allJobTitles = data
        .flatMap(course => course.attached_jobs || [])
        .filter(Boolean);
      
      const uniqueJobTitles = [...new Set(allJobTitles)].sort();
      return uniqueJobTitles;
    },
  });

  const createJobTitleMutation = useMutation({
    mutationFn: async (jobTitle: string) => {
      if (!company) {
        throw new Error('Please select a company first');
      }

      // Find existing course for this company
      const { data: courses, error: fetchError } = await supabase
        .from('courses')
        .select('id, attached_jobs')
        .eq('company', company)
        .limit(1);

      if (fetchError) throw fetchError;

      if (courses && courses.length > 0) {
        // Update existing course
        const existingJobs = courses[0].attached_jobs || [];
        if (!existingJobs.includes(jobTitle)) {
          const { error } = await supabase
            .from('courses')
            .update({
              attached_jobs: [...existingJobs, jobTitle]
            })
            .eq('id', courses[0].id);

          if (error) throw error;
        }
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert({
            company,
            title: `${company} Training Course`,
            description: `Training course for ${company}`,
            attached_jobs: [jobTitle]
          });

        if (error) throw error;
      }

      return jobTitle;
    },
    onSuccess: (jobTitle) => {
      queryClient.invalidateQueries({ queryKey: ['job-titles', company] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onChange(jobTitle);
      setNewJobTitle('');
      setIsAddingNew(false);
      toast.success('Job title added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add job title: ${error.message}`);
    },
  });

  const handleAddJobTitle = () => {
    if (!newJobTitle.trim()) return;
    createJobTitleMutation.mutate(newJobTitle.trim());
  };

  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="" disabled>Loading job titles...</SelectItem>
          ) : (
            <>
              {jobTitles.map((jobTitle) => (
                <SelectItem key={jobTitle} value={jobTitle}>
                  {jobTitle}
                </SelectItem>
              ))}
              <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                <DialogTrigger asChild>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent">
                    <Plus className="w-4 h-4" />
                    Add new job title
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Job Title</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-job-title">Job Title</Label>
                      <Input
                        id="new-job-title"
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        placeholder="Enter job title"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddJobTitle();
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingNew(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddJobTitle}
                        disabled={createJobTitleMutation.isPending || !newJobTitle.trim() || !company}
                        className="flex-1"
                      >
                        {createJobTitleMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Job Title
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};