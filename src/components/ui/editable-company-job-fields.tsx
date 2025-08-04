import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { CompanySelect, JobTitleSelect } from '@/components/ui/company-job-select';

interface EditableCompanyJobFieldsProps {
  appliedCompany: string;
  appliedJobTitle: string;
  onUpdate: (updates: { company?: string; jobTitle?: string }) => Promise<void>;
  isUpdating?: boolean;
}

export const EditableCompanyJobFields: React.FC<EditableCompanyJobFieldsProps> = ({
  appliedCompany,
  appliedJobTitle,
  onUpdate,
  isUpdating = false
}) => {
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingJobTitle, setIsEditingJobTitle] = useState(false);
  const [editCompany, setEditCompany] = useState(appliedCompany || '');
  const [editJobTitle, setEditJobTitle] = useState(appliedJobTitle || '');

  const handleCompanySave = async () => {
    await onUpdate({ company: editCompany });
    setIsEditingCompany(false);
  };

  const handleJobTitleSave = async () => {
    await onUpdate({ jobTitle: editJobTitle });
    setIsEditingJobTitle(false);
  };

  const handleCompanyCancel = () => {
    setEditCompany(appliedCompany || '');
    setIsEditingCompany(false);
  };

  const handleJobTitleCancel = () => {
    setEditJobTitle(appliedJobTitle || '');
    setIsEditingJobTitle(false);
  };

  return (
    <>
      {/* Editable Applied Company */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Applied Company:</span>
          {!isEditingCompany && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 edit-controls"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingCompany(true);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {isEditingCompany ? (
          <div className="flex items-center gap-1 edit-controls">
            <CompanySelect
              value={editCompany}
              onChange={setEditCompany}
              placeholder="Select company"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCompanySave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCompanyCancel}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="text-xs text-foreground bg-muted px-2 py-1 rounded">
            {appliedCompany || 'Not specified'}
          </div>
        )}
      </div>

      {/* Editable Applied Job Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Applied Role:</span>
          {!isEditingJobTitle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 edit-controls"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingJobTitle(true);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {isEditingJobTitle ? (
          <div className="flex items-center gap-1 edit-controls">
            <JobTitleSelect
              value={editJobTitle}
              onChange={setEditJobTitle}
              company={appliedCompany}
              placeholder="Select job title"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleJobTitleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleJobTitleCancel}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="text-xs text-foreground bg-muted px-2 py-1 rounded">
            {appliedJobTitle || 'Not specified'}
          </div>
        )}
      </div>
    </>
  );
};