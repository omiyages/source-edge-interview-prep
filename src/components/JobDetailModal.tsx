
// ABOUTME: Shared modal for displaying full job assignment details
// ABOUTME: Used by both the candidate dashboard tab and the public token page

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SecureRichTextDisplay } from '@/components/SecureRichTextDisplay';
import { MapPin, Briefcase, Globe, CheckCircle2, ThumbsUp } from 'lucide-react';
import type { AssignmentStatus } from '@/services/jobAssignmentService';

export interface JobDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  status: AssignmentStatus;
  responded_at: string | null;
  job_title: string;
  company: string;
  location: string;
  working_style: string;
  japanese_level: string | null;
  division: string | null;
  job_description: string | null;
  requirements: string | null;
  nice_to_haves: string | null;
  benefits: string | null;
  ai_summary: string | null;
  onRespond?: (assignmentId: string) => void;
  isResponding?: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  open,
  onOpenChange,
  assignmentId,
  status,
  responded_at,
  job_title,
  company,
  location,
  working_style,
  japanese_level,
  division,
  job_description,
  requirements,
  nice_to_haves,
  benefits,
  ai_summary,
  onRespond,
  isResponding = false,
}) => {
  const isInterested = status === 'interested';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-100">
            {job_title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-400">
            <span className="font-medium text-neutral-300">{company}</span>
            {division && (
              <>
                <span>·</span>
                <span>{division}</span>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="border-neutral-700 text-neutral-300 gap-1">
            <MapPin className="w-3 h-3" />
            {location}
          </Badge>
          <Badge variant="outline" className="border-neutral-700 text-neutral-300 gap-1">
            <Briefcase className="w-3 h-3" />
            {working_style}
          </Badge>
          {japanese_level && (
            <Badge variant="outline" className="border-neutral-700 text-neutral-300 gap-1">
              <Globe className="w-3 h-3" />
              Japanese: {japanese_level}
            </Badge>
          )}
          {isInterested && (
            <Badge className="bg-emerald-900/40 text-emerald-400 border-0 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Interested
            </Badge>
          )}
        </div>

        {/* AI Summary */}
        {ai_summary && (
          <div className="mt-4 p-3 rounded-lg bg-neutral-800 border border-neutral-700">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              AI Summary
            </p>
            <p className="text-sm text-neutral-300">{ai_summary}</p>
          </div>
        )}

        {/* Job Description */}
        {job_description && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">Job Description</h3>
            <SecureRichTextDisplay
              content={job_description}
              className="text-sm text-neutral-400 prose-invert prose-p:text-neutral-400 prose-li:text-neutral-400 prose-headings:text-neutral-300"
            />
          </div>
        )}

        {/* Requirements */}
        {requirements && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">Requirements</h3>
            <SecureRichTextDisplay
              content={requirements}
              className="text-sm text-neutral-400 prose-invert prose-p:text-neutral-400 prose-li:text-neutral-400 prose-headings:text-neutral-300"
            />
          </div>
        )}

        {/* Nice to Haves */}
        {nice_to_haves && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">Nice to Haves</h3>
            <SecureRichTextDisplay
              content={nice_to_haves}
              className="text-sm text-neutral-400 prose-invert prose-p:text-neutral-400 prose-li:text-neutral-400 prose-headings:text-neutral-300"
            />
          </div>
        )}

        {/* Benefits */}
        {benefits && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">Benefits</h3>
            <SecureRichTextDisplay
              content={benefits}
              className="text-sm text-neutral-400 prose-invert prose-p:text-neutral-400 prose-li:text-neutral-400 prose-headings:text-neutral-300"
            />
          </div>
        )}

        {/* Footer actions */}
        {onRespond && (
          <div className="flex justify-end pt-4 border-t border-neutral-800 mt-4">
            {isInterested ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                You've expressed interest
                {responded_at && (
                  <span className="text-neutral-500">
                    · {new Date(responded_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <Button
                onClick={() => onRespond(assignmentId)}
                disabled={isResponding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                {isResponding ? 'Saving...' : "I'm Interested"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
