
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  DollarSign, 
  Calendar,
  Building2,
  Star,
  UserPlus
} from 'lucide-react';
import { ConvertCandidateToUserDialog } from './ConvertCandidateToUserDialog';

interface CandidateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
  onRefresh?: () => void;
}

export const CandidateDetailDialog = ({ 
  open, 
  onOpenChange, 
  candidate,
  onRefresh
}: CandidateDetailDialogProps) => {
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  if (!candidate) return null;

  const isUser = candidate.is_user || candidate.user_id;
  const hasEmail = candidate.email && !candidate.email.includes('@noemail.local');

  const handleConvertSuccess = () => {
    onRefresh?.();
    setShowConvertDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {candidate.full_name || 'Unnamed Candidate'}
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
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Convert to User Button */}
            {!isUser && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Pipeline Candidate</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This candidate is not yet a user. Convert them to a user to enable full functionality.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowConvertDialog(true)}
                    size="sm"
                    className="ml-4"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convert to User
                  </Button>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                )}
                
                {candidate.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{candidate.phone_number}</span>
                  </div>
                )}
                
                {candidate.linkedin_profile && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <a 
                      href={candidate.linkedin_profile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.current_company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{candidate.current_company}</span>
                  </div>
                )}
                
                {candidate.years_of_experience && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{candidate.years_of_experience} years experience</span>
                  </div>
                )}
                
                {candidate.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">${candidate.salary.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Application Details */}
            {(candidate.applied_company || candidate.applied_job_title) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Application Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidate.applied_company && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{candidate.applied_company}</span>
                      </div>
                    )}
                    
                    {candidate.applied_job_title && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{candidate.applied_job_title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Skills */}
            {candidate.skillsets && candidate.skillsets.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skillsets.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Past Companies */}
            {candidate.past_companies && candidate.past_companies.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Past Companies</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.past_companies.map((company: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {candidate.general_notes && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {candidate.general_notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConvertCandidateToUserDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        candidate={candidate}
        onSuccess={handleConvertSuccess}
      />
    </>
  );
};
