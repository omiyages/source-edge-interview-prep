/**
 * Persist BD parsed job listings server-side.
 *
 * Why:
 * - Avoid brittle browser/PostgREST failures (missing apikey headers, CSP, etc.)
 * - Use service role for reliable upserts
 * - Keep admin authorization via Clerk JWT (profiles.role === admin)
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "../../../src/integrations/supabase/types.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = [
  "https://omiyages.com",
  "https://www.omiyages.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  init: { status?: number; corsHeaders: Record<string, string> },
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...init.corsHeaders, "Content-Type": "application/json" },
  });
}

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(
    parts[1].length + (4 - (parts[1].length % 4)) % 4,
    "=",
  );
  return JSON.parse(atob(padded));
}

async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = decodeJwtPayload(token);
    const clerkId = payload["sub"] as string | undefined;
    if (!clerkId) return false;

    // Try both legacy and current profile shapes.
    const byClerk = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("clerk_id", clerkId)
      .maybeSingle();
    if (byClerk.data?.role === "admin") return true;

    const byId = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", clerkId)
      .maybeSingle();
    return byId.data?.role === "admin";
  } catch {
    return false;
  }
}

type PersistRow = {
  company_id?: string | null;
  company: string;
  ats_platform: string;
  external_id: string;
  hosted_url: string | null;
  title: string;
  description_plain: string | null;
  location: string | null;
  department: string | null;
  team: string | null;
  commitment: string | null;
  workplace_type: string | null;
  japanese_level: string | null;
  role_category: string | null;
  tech_stack: string | null;
  translation_status: "pending" | "done" | "error" | "skipped";
  title_ja: string | null;
  description_plain_ja: string | null;
  location_ja: string | null;
  commitment_ja: string | null;
};

function normalizeRow(r: any): PersistRow | null {
  const company = String(r?.company ?? "").trim();
  const ats_platform = String(r?.ats_platform ?? "").trim();
  const external_id = String(r?.external_id ?? "").trim();
  const title = String(r?.title ?? "").trim();
  if (!company || !ats_platform || !external_id || !title) return null;

  const translation_status = (r?.translation_status ?? "pending") as PersistRow["translation_status"];
  const allowed = new Set(["pending", "done", "error", "skipped"]);
  const safeStatus = allowed.has(translation_status) ? translation_status : "pending";

  return {
    company_id: r?.company_id ?? null,
    company,
    ats_platform,
    external_id,
    hosted_url: r?.hosted_url ?? null,
    title,
    description_plain: r?.description_plain ?? null,
    location: r?.location ?? null,
    department: r?.department ?? null,
    team: r?.team ?? null,
    commitment: r?.commitment ?? null,
    workplace_type: r?.workplace_type ?? null,
    japanese_level: r?.japanese_level ?? null,
    role_category: r?.role_category ?? null,
    tech_stack: r?.tech_stack ?? null,
    translation_status: safeStatus,
    title_ja: r?.title_ja ?? null,
    description_plain_ja: r?.description_plain_ja ?? null,
    location_ja: r?.location_ja ?? null,
    commitment_ja: r?.commitment_ja ?? null,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405, corsHeaders });
  }

  const isAdmin = await verifyAdmin(req.headers.get("authorization"));
  if (!isAdmin) {
    return jsonResponse({ success: false, error: "Unauthorized" }, { status: 401, corsHeaders });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, { status: 400, corsHeaders });
  }

  const rowsIn = Array.isArray(payload?.rows) ? payload.rows : [];
  const rows = rowsIn.map(normalizeRow).filter(Boolean) as PersistRow[];
  if (rows.length === 0) {
    return jsonResponse({ success: true, upserted: 0 }, { corsHeaders });
  }

  // Some deployments have bd_company_jobs.company_id NOT NULL.
  // Populate it from bd_companies by matching on company name.
  const companyNames = [...new Set(rows.map((r) => r.company).filter(Boolean))];
  const { data: companies, error: companiesErr } = await supabaseAdmin
    .from("bd_companies")
    .select("id, name")
    .in("name", companyNames);

  if (companiesErr) {
    return jsonResponse(
      { success: false, error: `Failed to resolve company_id: ${companiesErr.message}` },
      { status: 400, corsHeaders },
    );
  }

  const nameToId = new Map<string, string>();
  (companies || []).forEach((c: any) => {
    if (c?.name && c?.id) nameToId.set(String(c.name), String(c.id));
  });

  const missingCompanyIds = new Set<string>();
  const rowsWithCompanyId = rows.map((r) => {
    const company_id = r.company_id ?? nameToId.get(r.company) ?? null;
    if (!company_id) missingCompanyIds.add(r.company);
    return { ...r, company_id };
  });

  if (missingCompanyIds.size > 0) {
    return jsonResponse(
      {
        success: false,
        error: "Missing bd_companies row for one or more companies",
        missing_companies: [...missingCompanyIds],
      },
      { status: 400, corsHeaders },
    );
  }

  const { error } = await supabaseAdmin
    .from("bd_company_jobs")
    .upsert(rowsWithCompanyId as any, { onConflict: "company,ats_platform,external_id" });

  if (error) {
    console.error("persist_bd_company_jobs_upsert_failed", {
      message: error.message,
      code: (error as any).code,
      hint: (error as any).hint,
      details: (error as any).details,
    });
    return jsonResponse(
      {
        success: false,
        error: error.message,
        code: (error as any).code ?? null,
        hint: (error as any).hint ?? null,
        details: (error as any).details ?? null,
      },
      { status: 400, corsHeaders },
    );
  }

  return jsonResponse({ success: true, upserted: rows.length }, { corsHeaders });
});

