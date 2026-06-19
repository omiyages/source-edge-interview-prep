import { clerkSupabaseClient } from '@/lib/clerk';
import type { Role, RoleFormData } from '@/types/role';

/** Turn job title + company into a stable URL slug. */
function generateSlug(jobTitle: string, company: string): string {
  return `${jobTitle}-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function getExistingSlugsForBase(baseSlug: string): Promise<Set<string>> {
  const { data, error } = await clerkSupabaseClient
    .from('roles')
    .select('slug')
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  if (error) throw new Error(`Failed to check slug uniqueness: ${error.message}`);

  const set = new Set<string>();
  (data || []).forEach((row: any) => {
    if (row?.slug) set.add(String(row.slug));
  });
  return set;
}

function nextUniqueSlug(baseSlug: string, taken: Set<string>): string {
  if (!taken.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await clerkSupabaseClient
    .from('roles')
    .select('id, slug, job_title, role_type, company, location, working_style, japanese_level, division, status, ai_summary, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch roles: ${error.message}`);
  return (data || []) as unknown as Role[];
}

export async function fetchRoleById(id: string): Promise<Role> {
  const { data, error } = await clerkSupabaseClient
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch role: ${error.message}`);
  return data as unknown as Role;
}

export async function fetchRoleBySlug(slugOrId: string): Promise<Role> {
  // Try slug first
  const { data: bySlug } = await clerkSupabaseClient
    .from('roles')
    .select('*')
    .eq('slug', slugOrId)
    .maybeSingle();

  if (bySlug) return bySlug as unknown as Role;

  // Fall back to UUID lookup (for roles created before slugs existed)
  const { data: byId, error } = await clerkSupabaseClient
    .from('roles')
    .select('*')
    .eq('id', slugOrId)
    .maybeSingle();

  if (error || !byId) throw new Error('Role not found');
  return byId as unknown as Role;
}

export async function createRole(role: RoleFormData, createdBy: string): Promise<Role> {
  const baseSlug = generateSlug(role.job_title, role.company);
  const takenSlugs = await getExistingSlugsForBase(baseSlug);
  const slug = nextUniqueSlug(baseSlug, takenSlugs);

  const { data, error } = await clerkSupabaseClient
    .from('roles')
    .insert({
      job_title: role.job_title,
      role_type: role.role_type || null,
      company: role.company,
      location: role.location,
      working_style: role.working_style,
      japanese_level: role.japanese_level,
      division: role.division || null,
      job_description: role.job_description || null,
      job_title_ja: role.job_title_ja ?? null,
      job_description_ja: role.job_description_ja ?? null,
      location_ja: role.location_ja ?? null,
      commitment_ja: role.commitment_ja ?? null,
      ats_platform: role.ats_platform ?? null,
      ats_external_id: role.ats_external_id ?? null,
      ats_hosted_url: role.ats_hosted_url ?? null,
      translation_status: role.translation_status ?? 'pending',
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
  if (data?.id) {
    void generateRoleSummary(data.id);
  }
  return data as unknown as Role;
}

export async function updateRole(id: string, role: Partial<RoleFormData>): Promise<Role> {
  const updatePayload: Record<string, unknown> = {
    ...role,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await clerkSupabaseClient
    .from('roles')
    .update(updatePayload as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update role: ${error.message}`);
  return data as unknown as Role;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await clerkSupabaseClient
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
    const { data, error } = await clerkSupabaseClient.functions.invoke(
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
  const slugCache = new Map<string, Set<string>>();

  const rolesToInsert = await Promise.all(
    roles.map(async (r) => {
      const baseSlug = generateSlug(r.job_title, r.company);
      let taken = slugCache.get(baseSlug);
      if (!taken) {
        taken = await getExistingSlugsForBase(baseSlug);
        slugCache.set(baseSlug, taken);
      }
      const uniqueSlug = nextUniqueSlug(baseSlug, taken);
      taken.add(uniqueSlug);

      return {
        job_title: r.job_title,
        role_type: r.role_type || null,
        company: r.company,
        location: r.location,
        working_style: r.working_style,
        japanese_level: r.japanese_level,
        division: r.division || null,
        job_description: r.job_description || null,
        requirements: r.requirements || null,
        nice_to_haves: r.nice_to_haves || null,
        benefits: r.benefits || null,
        status: r.status || 'active',
        created_by: createdBy,
        slug: uniqueSlug,
      };
    })
  );

  const { data, error } = await clerkSupabaseClient
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
