
// ABOUTME: Public job assignments page — no login required
// ABOUTME: Candidates access via a tokenized URL sent by their recruiter

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  fetchAssignmentsByToken,
  respondByToken,
} from '@/services/jobAssignmentService';
import { JobDetailModal } from '@/components/JobDetailModal';
import type { PublicAssignment } from '@/services/jobAssignmentService';
import { Briefcase, MapPin, CheckCircle2, ThumbsUp, AlertCircle, Globe } from 'lucide-react';

const AssignedJobsPublic: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openAssignment, setOpenAssignment] = useState<PublicAssignment | null>(null);

  const {
    data: assignments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-assignments', token],
    queryFn: () => fetchAssignmentsByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: (assignmentId: string) => respondByToken(token!, assignmentId),
    onSuccess: (_data, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['public-assignments', token] });
      // Optimistically update open modal
      if (openAssignment && openAssignment.assignment_id === assignmentId) {
        setOpenAssignment(prev =>
          prev ? { ...prev, status: 'interested', responded_at: new Date().toISOString() } : null,
        );
      }
      toast({ title: "Great! You've expressed interest." });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to respond', description: e.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Loading your job matches...</p>
        </div>
      </div>
    );
  }

  if (isError || !token) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-neutral-100 mb-2">Link invalid or expired</h2>
          <p className="text-neutral-400 text-sm">
            This link may have expired or is no longer valid. Please contact your recruiter for a new one.
          </p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Briefcase className="w-12 h-12 mx-auto text-neutral-700 mb-4" />
          <h2 className="text-xl font-bold text-neutral-100 mb-2">No jobs shared yet</h2>
          <p className="text-neutral-400 text-sm">
            Your recruiter hasn't assigned any jobs to this link yet. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  const candidateName = assignments[0]?.candidate_name || 'there';
  const interestedCount = assignments.filter(a => a.status === 'interested').length;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-100 leading-tight">
                Jobs Curated for You
              </h1>
              <p className="text-xs text-neutral-500">
                Hi {candidateName} — review your matched opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-neutral-500">
            {assignments.length} job{assignments.length !== 1 ? 's' : ''} matched
            {interestedCount > 0 && (
              <span className="text-emerald-500 ml-1">· {interestedCount} interested</span>
            )}
          </p>
        </div>

        <div className="space-y-3">
          {assignments.map(a => {
            const isInterested = a.status === 'interested';

            return (
              <Card
                key={a.assignment_id}
                className="border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-neutral-100">{a.job_title}</p>
                        {isInterested && (
                          <Badge className="bg-emerald-900/40 text-emerald-400 border-0 flex-shrink-0 gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Interested
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">
                        {a.company}
                        {a.division && <span className="text-neutral-600"> · {a.division}</span>}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {a.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {a.working_style}
                        </span>
                        {a.japanese_level && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Japanese: {a.japanese_level}
                          </span>
                        )}
                      </div>
                      {a.ai_summary && (
                        <p className="mt-2 text-xs text-neutral-500 line-clamp-2">{a.ai_summary}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neutral-700 text-neutral-300 hover:text-neutral-100 text-xs whitespace-nowrap"
                        onClick={() => setOpenAssignment(a)}
                      >
                        View More
                      </Button>
                      {!isInterested && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 whitespace-nowrap"
                          onClick={() => respondMutation.mutate(a.assignment_id)}
                          disabled={respondMutation.isPending}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Interested
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-neutral-700 mt-8">
          Powered by Omiyages · Secure private link
        </p>
      </div>

      {/* Job Detail Modal */}
      {openAssignment && (
        <JobDetailModal
          open={!!openAssignment}
          onOpenChange={open => { if (!open) setOpenAssignment(null); }}
          assignmentId={openAssignment.assignment_id}
          status={openAssignment.status}
          responded_at={openAssignment.responded_at}
          job_title={openAssignment.job_title}
          company={openAssignment.company}
          location={openAssignment.location}
          working_style={openAssignment.working_style}
          japanese_level={openAssignment.japanese_level}
          division={openAssignment.division}
          job_description={openAssignment.job_description}
          requirements={openAssignment.requirements}
          nice_to_haves={openAssignment.nice_to_haves}
          benefits={openAssignment.benefits}
          ai_summary={openAssignment.ai_summary}
          onRespond={id => respondMutation.mutate(id)}
          isResponding={respondMutation.isPending}
        />
      )}
    </div>
  );
};

export default AssignedJobsPublic;
