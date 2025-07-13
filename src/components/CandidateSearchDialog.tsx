
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Mail, Building2, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const handleSelectCandidate = (candidate: Candidate) => {
    onSelectCandidate(candidate, appliedCompany || undefined, appliedJobTitle || undefined);
    onOpenChange(false);
    setSearchTerm('');
    setAppliedCompany('');
    setAppliedJobTitle('');
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
          <DialogTitle>Add Candidate to Pipeline</DialogTitle>
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
              <Input
                placeholder="Enter job title..."
                value={appliedJobTitle}
                onChange={(e) => setAppliedJobTitle(e.target.value)}
              />
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
    </Dialog>
  );
};
