import { clerkSupabaseClient } from '@/lib/clerk';
import { supabase } from '@/integrations/supabase/client';
import type { Role } from '@/types/role';

export type AssignmentStatus = 'pending' | 'interested';

export interface JobAssignment {
  id: string;
  candidate_id: string;
  role_id: string;
  assigned_by: string;
  status: AssignmentStatus;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithRole extends JobAssignment {
  role: Role;
}

export interface PublicAssignment {
  assignment_id: string;
  role_id: string;
  status: AssignmentStatus;
  responded_at: string | null;
  assigned_at: string;
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
  slug: string | null;
  candidate_name: string | null;
  candidate_email: string;
}

/** Fetch all assignments for a specific candidate (admin use). */
export async function fetchAssignmentsForCandidate(candidateId: string): Promise<AssignmentWithRole[]> {
  const { data, error } = await clerkSupabaseClient
    .from('job_assignments')
    .select('*, role:roles(*)')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AssignmentWithRole[];
}

/** Fetch assignments for the currently authenticated candidate. */
export async function fetchMyAssignments(): Promise<AssignmentWithRole[]> {
  const { data, error } = await clerkSupabaseClient
    .from('job_assignments')
    .select('*, role:roles(*)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AssignmentWithRole[];
}

/** Assign one or more roles to a candidate. Silently skips duplicates. */
export async function assignJobsToCandidate(
  candidateId: string,
  roleIds: string[],
  assignedBy: string,
): Promise<void> {
  if (roleIds.length === 0) return;

  const rows = roleIds.map((roleId) => ({
    candidate_id: candidateId,
    role_id: roleId,
    assigned_by: assignedBy,
  }));

  const { error } = await clerkSupabaseClient
    .from('job_assignments')
    .upsert(rows, { onConflict: 'candidate_id,role_id', ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

/** Remove a single job assignment. */
export async function removeJobAssignment(assignmentId: string): Promise<void> {
  const { error } = await clerkSupabaseClient
    .from('job_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw new Error(error.message);
}

/** Respond to one or more assignments (candidate, authenticated). */
export async function respondToAssignments(
  assignmentIds: string[],
  status: AssignmentStatus,
): Promise<void> {
  if (assignmentIds.length === 0) return;

  const { error } = await clerkSupabaseClient
    .from('job_assignments')
    .update({
      status,
      responded_at: status !== 'pending' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .in('id', assignmentIds);

  if (error) throw new Error(error.message);
}

/** Get or create a public share token for a candidate (admin use). */
export async function getOrCreateCandidateToken(candidateId: string): Promise<string> {
  const { data: existing } = await clerkSupabaseClient
    .from('job_assignment_tokens')
    .select('token')
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (existing?.token) return existing.token as string;

  const { data, error } = await clerkSupabaseClient
    .from('job_assignment_tokens')
    .insert({ candidate_id: candidateId })
    .select('token')
    .single();

  if (error) throw new Error(error.message);
  return data.token as string;
}

/** Fetch assignments via public token — no authentication required. */
export async function fetchAssignmentsByToken(token: string): Promise<PublicAssignment[]> {
  const { data, error } = await supabase.rpc('get_assignments_by_token', {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicAssignment[];
}

/** Respond to an assignment via public token — no authentication required. */
export async function respondByToken(
  token: string,
  assignmentId: string,
): Promise<void> {
  const { error } = await supabase.rpc('respond_assignment_by_token', {
    p_token: token,
    p_assignment_id: assignmentId,
    p_status: 'interested',
  });
  if (error) throw new Error(error.message);
}
