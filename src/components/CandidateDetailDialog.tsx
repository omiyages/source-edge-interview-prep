
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Mail, Building2, Briefcase, Calendar, Clock, User, Phone, DollarSign, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/utils/formatters';
import { EditCandidateDialog } from './EditCandidateDialog';

interface CandidateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
}

export const CandidateDetailDialog: React.FC<CandidateDetailDialogProps> = ({
  open,
  onOpenChange,
  candidate
}) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (candidate?.general_notes) {
      setNotes(candidate.general_notes);
    }
  }, [candidate]);

  const handleSaveNotes = async () => {
    if (!candidate?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ general_notes: notes })
        .eq('id', candidate.id);

      if (error) {
        console.error('Error saving notes:', error);
        toast.error('Failed to save notes');
      } else {
        toast.success('Notes saved successfully');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSave = () => {
    // Refresh the candidate data or trigger a refetch
    // This would typically be handled by the parent component
    toast.success('Candidate updated successfully');
  };

  if (!candidate) return null;

  const displayName = candidate.full_name || candidate.email.split('@')[0];
  
  const getCompanyIcon = (companyName?: string | null) => {
    if (!companyName) return displayName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
    
    const company = companyName.toLowerCase();
    if (company.includes('woven')) return 'Woven';
    if (company.includes('wismettac')) return 'Wis';
    if (company.includes('lexxpluss')) return 'LP';
    
    return companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const companyIcon = getCompanyIcon(candidate.applied_company);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Candidate Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {companyIcon}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium">{displayName}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{candidate.email}</span>
                </div>
                
                {candidate.phone_number && (
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{candidate.phone_number}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {candidate.linkedin_profile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(candidate.linkedin_profile, '_blank')}
                    className="text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Application Info */}
            {candidate.applied_company && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal">{candidate.applied_company}</span>
                  </div>
                  
                  {candidate.applied_job_title && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal">{candidate.applied_job_title}</span>
                    </div>
                  )}
                  
                  {candidate.application_created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal">Applied: {formatDate(candidate.application_created_at)}</span>
                    </div>
                  )}
                  
                  {candidate.moved_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal">Last Updated: {formatDate(candidate.moved_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidate.current_company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal">Current Company: {candidate.current_company}</span>
                  </div>
                )}
                
                {candidate.years_of_experience && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal">Experience: {candidate.years_of_experience} years</span>
                  </div>
                )}
                
                {candidate.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal">Salary: ${candidate.salary.toLocaleString()}</span>
                  </div>
                )}
                
                {candidate.skillsets && candidate.skillsets.length > 0 && (
                  <div>
                    <span className="text-sm font-normal text-muted-foreground mb-2 block">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skillsets.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs font-normal">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {candidate.past_companies && candidate.past_companies.length > 0 && (
                  <div>
                    <span className="text-sm font-normal text-muted-foreground mb-2 block">Past Companies:</span>
                    <div className="flex flex-wrap gap-1">
                      {candidate.past_companies.map((company: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs font-normal">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="notes" className="text-sm font-normal">General Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this candidate..."
                    rows={4}
                    className="mt-1 text-sm"
                  />
                </div>
                
                <Button 
                  onClick={handleSaveNotes}
                  disabled={isLoading}
                  className="w-full text-sm"
                >
                  {isLoading ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <EditCandidateDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        candidate={candidate}
        onSave={handleEditSave}
      />
    </>
  );
};
