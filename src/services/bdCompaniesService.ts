import { clerkSupabaseClient } from "@/lib/clerk";
import { detectATS } from "@/lib/ats/detector";
import type { ATSPlatform } from "@/lib/ats/types";

export type BdCompanyRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  /** Board URL — stored as `ats_url` in DB (legacy column name). */
  careers_url: string;
  ats_platform: ATSPlatform | null;
  jobs_count: number;
  status: "pending" | "parsed" | "error";
  last_parsed_at: string | null;
};

function normalizeStatus(raw: unknown): BdCompanyRow["status"] {
  const s = typeof raw === "string" ? raw : "";
  if (s === "parsed" || s === "error") return s;
  // Legacy / alternate values (e.g. never_parsed) → treat as not yet successfully parsed
  return "pending";
}

function mapRow(r: Record<string, unknown>): BdCompanyRow {
  const platform = r.ats_platform as string | null;
  const valid: ATSPlatform[] = ["lever", "greenhouse", "workable", "teamtailor", "hrmos"];
  const ats_platform =
    platform && (valid as string[]).includes(platform) ? (platform as ATSPlatform) : null;
  const atsUrl = r.ats_url ?? r.careers_url;
  return {
    id: String(r.id),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    name: String(r.name),
    careers_url: atsUrl != null ? String(atsUrl) : "",
    ats_platform,
    jobs_count: Number(r.jobs_count ?? 0),
    status: normalizeStatus(r.status),
    last_parsed_at: r.last_parsed_at ? String(r.last_parsed_at) : null,
  };
}

export async function listBdCompanies(): Promise<BdCompanyRow[]> {
  const { data, error } = await clerkSupabaseClient
    .from("bd_companies")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load BD companies: ${error.message}`);
  return (data || []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function createBdCompany(input: {
  name: string;
  careers_url: string;
}): Promise<BdCompanyRow> {
  const url = input.careers_url.trim();
  const { platform } = detectATS(url);

  const { data, error } = await clerkSupabaseClient
    .from("bd_companies")
    .insert({
      name: input.name.trim(),
      ats_url: url,
      ats_platform: platform,
      jobs_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add company: ${error.message}`);
  return mapRow(data as Record<string, unknown>);
}

export async function deleteBdCompany(id: string): Promise<void> {
  const { error } = await clerkSupabaseClient.from("bd_companies").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete company: ${error.message}`);
}

export async function updateBdCompanyParseResult(
  id: string,
  patch: {
    jobs_count: number;
    status: "parsed" | "error";
    last_parsed_at: string;
    ats_platform?: ATSPlatform | null;
  },
): Promise<void> {
  const update: Record<string, unknown> = {
    jobs_count: patch.jobs_count,
    status: patch.status,
    last_parsed_at: patch.last_parsed_at,
  };
  if (patch.ats_platform !== undefined) update.ats_platform = patch.ats_platform;

  const { error } = await clerkSupabaseClient.from("bd_companies").update(update).eq("id", id);
  if (error) throw new Error(`Failed to update parse result: ${error.message}`);
}
