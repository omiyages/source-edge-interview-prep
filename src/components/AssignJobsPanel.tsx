
// ABOUTME: Admin dialog for assigning jobs to a specific candidate
// ABOUTME: Shows existing assignments, lists available roles with search, and generates a shareable link

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { fetchRoles } from '@/services/rolesService';
import {
  fetchAssignmentsForCandidate,
  assignJobsToCandidate,
  removeJobAssignment,
  getOrCreateCandidateToken,
} from '@/services/jobAssignmentService';
import { Search, Link2, Trash2, CheckCircle2, Clock, Plus } from 'lucide-react';

interface AssignJobsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
}

export const AssignJobsPanel: React.FC<AssignJobsPanelProps> = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    enabled: open,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['candidate-assignments', candidateId],
    queryFn: () => fetchAssignmentsForCandidate(candidateId),
    enabled: open && !!candidateId,
  });

  const assignedRoleIds = useMemo(
    () => new Set(assignments.map(a => a.role_id)),
    [assignments],
  );

  const availableRoles = useMemo(() => {
    return roles.filter(r => {
      if (assignedRoleIds.has(r.id)) return false;
      if (r.status !== 'active') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.job_title.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [roles, assignedRoleIds, search]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId],
    );
  };

  const assignMutation = useMutation({
    mutationFn: () => assignJobsToCandidate(candidateId, selectedRoleIds, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-assignments', candidateId] });
      const count = selectedRoleIds.length;
      setSelectedRoleIds([]);
      toast({ title: `${count} job${count !== 1 ? 's' : ''} assigned successfully.` });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to assign jobs', description: e.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) => removeJobAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-assignments', candidateId] });
      toast({ title: 'Assignment removed.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to remove', description: e.message, variant: 'destructive' });
    },
  });

  const handleCopyLink = async () => {
    setLoadingLink(true);
    try {
      const token = await getOrCreateCandidateToken(candidateId);
      const link = `${window.location.origin}/jobs/shared/${token}`;
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast({ title: 'Share link copied to clipboard!' });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (e: unknown) {
      toast({
        title: 'Failed to generate link',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoadingLink(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-neutral-100">
            Assign Jobs — {candidateName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 min-h-0">
          {/* Currently Assigned */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Currently Assigned ({assignments.length})
            </h3>
            {assignmentsLoading ? (
              <p className="text-sm text-neutral-500">Loading...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-neutral-500">No jobs assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-800 border border-neutral-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">
                        {a.role.job_title}
                      </p>
                      <p className="text-xs text-neutral-500">{a.role.company}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {a.status === 'interested' ? (
                        <Badge className="bg-emerald-900/40 text-emerald-400 border-0 text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Interested
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-neutral-600 text-neutral-400 text-xs gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          Pending
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-neutral-500 hover:text-red-400"
                        onClick={() => removeMutation.mutate(a.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add More Jobs */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Add Jobs
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Search by title or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500"
              />
            </div>
            {availableRoles.length === 0 ? (
              <p className="text-sm text-neutral-500 py-2">
                {search
                  ? 'No matching roles found.'
                  : 'All active roles are already assigned.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {availableRoles.map(role => (
                  <label
                    key={role.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800 border border-neutral-700 cursor-pointer hover:border-neutral-600 transition-colors"
                  >
                    <Checkbox
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">
                        {role.job_title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {role.company} · {role.location}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            disabled={loadingLink}
            className="border-neutral-700 text-neutral-300 hover:text-neutral-100 gap-2"
          >
            <Link2 className="w-4 h-4" />
            {linkCopied ? 'Link Copied!' : 'Copy Share Link'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-neutral-400"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => assignMutation.mutate()}
              disabled={selectedRoleIds.length === 0 || assignMutation.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {assignMutation.isPending
                ? 'Assigning...'
                : `Assign${selectedRoleIds.length > 0 ? ` (${selectedRoleIds.length})` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
