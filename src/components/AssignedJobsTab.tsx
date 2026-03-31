
// ABOUTME: Candidate dashboard tab showing jobs assigned by the recruiter
// ABOUTME: Supports individual and bulk "Interested" responses with a sticky bulk action bar

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMyAssignments,
  respondToAssignments,
} from '@/services/jobAssignmentService';
import { JobDetailModal } from '@/components/JobDetailModal';
import type { AssignmentWithRole } from '@/services/jobAssignmentService';
import { MapPin, Briefcase, CheckCircle2, Clock, ThumbsUp } from 'lucide-react';

export const AssignedJobsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openAssignment, setOpenAssignment] = useState<AssignmentWithRole | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: fetchMyAssignments,
  });

  const respondMutation = useMutation({
    mutationFn: (ids: string[]) => respondToAssignments(ids, 'interested'),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      setSelectedIds([]);
      // Close modal if the responded assignment was open
      if (openAssignment && ids.includes(openAssignment.id)) {
        setOpenAssignment(prev => prev ? { ...prev, status: 'interested', responded_at: new Date().toISOString() } : null);
      }
      toast({
        title: `Marked ${ids.length} job${ids.length !== 1 ? 's' : ''} as interested!`,
      });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to respond', description: e.message, variant: 'destructive' });
    },
  });

  const pendingAssignments = useMemo(
    () => assignments.filter(a => a.status === 'pending'),
    [assignments],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-neutral-500 text-sm">
        Loading assigned jobs...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="py-12 text-center">
        <Briefcase className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
        <p className="text-neutral-400 font-medium">No jobs assigned yet</p>
        <p className="text-sm text-neutral-600 mt-1">
          Your recruiter will share relevant opportunities here.
        </p>
      </div>
    );
  }

  return (
    <>
      {pendingAssignments.length > 0 && (
        <p className="text-xs text-neutral-500 mb-3">
          {pendingAssignments.length} new job{pendingAssignments.length !== 1 ? 's' : ''} — select any to bulk respond
        </p>
      )}

      <div className="space-y-3 pb-20">
        {assignments.map(a => {
          const isInterested = a.status === 'interested';
          const isSelected = selectedIds.includes(a.id);

          return (
            <Card
              key={a.id}
              className={`border-neutral-800 bg-neutral-900 transition-colors ${
                isSelected ? 'border-primary/40' : 'hover:border-neutral-700'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox — only for pending */}
                  {!isInterested && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(a.id)}
                      className="mt-1 flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-neutral-100">{a.role.job_title}</p>
                        <p className="text-sm text-neutral-400">{a.role.company}</p>
                      </div>
                      {isInterested ? (
                        <Badge className="bg-emerald-900/40 text-emerald-400 border-0 flex-shrink-0 gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Interested
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-neutral-700 text-neutral-500 flex-shrink-0 gap-1 text-xs"
                        >
                          <Clock className="w-3 h-3" />
                          New
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.role.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {a.role.working_style}
                      </span>
                    </div>

                    {a.role.ai_summary && (() => {
                      let parsed: { candidate?: string; responsibility?: string } | null = null;
                      try { parsed = JSON.parse(a.role.ai_summary!); } catch { /* plain text */ }
                      if (parsed?.candidate || parsed?.responsibility) {
                        return (
                          <ul className="mt-2 space-y-0.5 list-disc list-inside">
                            {parsed.candidate && <li className="text-xs text-neutral-500 line-clamp-2">{parsed.candidate}</li>}
                            {parsed.responsibility && <li className="text-xs text-neutral-500 line-clamp-2">{parsed.responsibility}</li>}
                          </ul>
                        );
                      }
                      return <p className="mt-2 text-xs text-neutral-500 line-clamp-2">{a.role.ai_summary}</p>;
                    })()}
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        onClick={() => respondMutation.mutate([a.id])}
                        disabled={respondMutation.isPending}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Yes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-3 bg-neutral-800 border border-neutral-700 rounded-full px-5 py-3 shadow-2xl pointer-events-auto">
            <span className="text-sm text-neutral-300 font-medium">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => respondMutation.mutate(selectedIds)}
              disabled={respondMutation.isPending}
            >
              <ThumbsUp className="w-4 h-4" />
              {respondMutation.isPending
                ? 'Saving...'
                : `Say Yes to ${selectedIds.length}`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-neutral-400 hover:text-neutral-200"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {openAssignment && (
        <JobDetailModal
          open={!!openAssignment}
          onOpenChange={open => { if (!open) setOpenAssignment(null); }}
          assignmentId={openAssignment.id}
          status={openAssignment.status}
          responded_at={openAssignment.responded_at}
          job_title={openAssignment.role.job_title}
          company={openAssignment.role.company}
          location={openAssignment.role.location}
          working_style={openAssignment.role.working_style}
          japanese_level={openAssignment.role.japanese_level}
          division={openAssignment.role.division}
          job_description={openAssignment.role.job_description}
          requirements={openAssignment.role.requirements}
          nice_to_haves={openAssignment.role.nice_to_haves}
          benefits={openAssignment.role.benefits}
          ai_summary={openAssignment.role.ai_summary}
          onRespond={id => respondMutation.mutate([id])}
          isResponding={respondMutation.isPending}
        />
      )}
    </>
  );
};
