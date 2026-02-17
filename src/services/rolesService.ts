import { supabase } from '@/integrations/supabase/client';
import type { Role, RoleFormData } from '@/types/role';

/** Turn a job title + company into a URL-friendly slug, with a short unique suffix. */
function generateSlug(jobTitle: string, company: string): string {
  const base = `${jobTitle}-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch roles: ${error.message}`);
  return (data || []) as unknown as Role[];
}

export async function fetchRoleById(id: string): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch role: ${error.message}`);
  return data as unknown as Role;
}

export async function fetchRoleBySlug(slugOrId: string): Promise<Role> {
  // Try slug first
  const { data: bySlug } = await supabase
    .from('roles')
    .select('*')
    .eq('slug', slugOrId)
    .maybeSingle();

  if (bySlug) return bySlug as unknown as Role;

  // Fall back to UUID lookup (for roles created before slugs existed)
  const { data: byId, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', slugOrId)
    .maybeSingle();

  if (error || !byId) throw new Error('Role not found');
  return byId as unknown as Role;
}

export async function createRole(role: RoleFormData, createdBy: string): Promise<Role> {
  const slug = generateSlug(role.job_title, role.company);

  const { data, error } = await supabase
    .from('roles')
    .insert({
      job_title: role.job_title,
      company: role.company,
      location: role.location,
      working_style: role.working_style,
      division: role.division || null,
      job_description: role.job_description || null,
      requirements: role.requirements || null,
      nice_to_haves: role.nice_to_haves || null,
      benefits: role.benefits || null,
      status: role.status,
      created_by: createdBy,
      slug,
    } as any)
    .select()
    .single();

  if (error) throw new Error(`Failed to create role: ${error.message}`);
  return data as unknown as Role;
}

export async function updateRole(id: string, role: Partial<RoleFormData>): Promise<Role> {
  const updatePayload: Record<string, unknown> = {
    ...role,
    updated_at: new Date().toISOString(),
  };

  // Regenerate slug if the title changed
  if (role.job_title && role.company) {
    updatePayload.slug = generateSlug(role.job_title, role.company);
  }

  const { data, error } = await supabase
    .from('roles')
    .update(updatePayload as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update role: ${error.message}`);
  return data as unknown as Role;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete role: ${error.message}`);
}

/**
 * Fire-and-forget: call the generate-role-summary Edge Function.
 * Returns the AI summary string on success, or null on failure.
 */
export async function generateRoleSummary(
  roleId: string,
  force = false
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-role-summary',
      { body: { role_id: roleId, force } }
    );
    if (error) {
      console.error('generateRoleSummary edge fn error:', error);
      return null;
    }
    return data?.ai_summary || null;
  } catch (err) {
    console.error('generateRoleSummary failed:', err);
    return null;
  }
}

export async function bulkCreateRoles(roles: RoleFormData[], createdBy: string): Promise<{ count: number; ids: string[] }> {
  const rolesToInsert = roles.map((r) => ({
    job_title: r.job_title,
    company: r.company,
    location: r.location,
    working_style: r.working_style,
    division: r.division || null,
    job_description: r.job_description || null,
    requirements: r.requirements || null,
    nice_to_haves: r.nice_to_haves || null,
    benefits: r.benefits || null,
    status: r.status || 'active',
    created_by: createdBy,
    slug: generateSlug(r.job_title, r.company),
  }));

  const { data, error } = await supabase
    .from('roles')
    .insert(rolesToInsert as any)
    .select('id');

  if (error) throw new Error(`Failed to bulk create roles: ${error.message}`);

  const ids = (data || []).map((r: any) => r.id as string);

  // Fire-and-forget: generate AI summaries for all imported roles
  ids.forEach((id) => {
    generateRoleSummary(id).catch(() => {});
  });

  return { count: rolesToInsert.length, ids };
}
