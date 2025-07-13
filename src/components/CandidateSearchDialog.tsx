import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail, Building, Calendar } from 'lucide-react';
import { AddCandidateToPipelineDialog } from './AddCandidateToPipelineDialog';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
  created_at: string;
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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['search-candidates', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .eq('is_active', true);

      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,current_company.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Candidate[];
    },
    enabled: open,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Add Candidates to Pipeline
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No candidates found matching your search.' : 'Start typing to search for candidates.'}
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {candidate.full_name || 'Unnamed User'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {candidate.email}
                        </div>
                        
                        {candidate.current_company && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building className="h-3 w-3" />
                            {candidate.current_company}
                            {candidate.years_of_experience && (
                              <span>• {candidate.years_of_experience} years exp.</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Added: {formatDate(candidate.created_at)}
                        </div>
                        
                        {candidate.skillsets && candidate.skillsets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.skillsets.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skillsets.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skillsets.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setShowAddDialog(true);
                        }}
                        size="sm"
                      >
                        Add to Pipeline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AddCandidateToPipelineDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          candidate={selectedCandidate}
          onConfirm={(appliedCompany, appliedJobTitle) => {
            if (selectedCandidate) {
              onSelectCandidate(selectedCandidate, appliedCompany, appliedJobTitle);
              onOpenChange(false);
              setSelectedCandidate(null);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};