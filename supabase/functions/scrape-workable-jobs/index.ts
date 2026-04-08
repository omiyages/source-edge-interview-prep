/**
 * Server-side Workable fetch — jobs.workable.com and apply.workable.com APIs
 * block browser CORS; this function proxies the same requests Deno-side.
 *
 * Auth: Clerk JWT + profiles.role === admin (same pattern as clerk-sync).
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = [
  "https://omiyages.com",
  "https://www.omiyages.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
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

// --- Workable API (same behavior as src/lib/ats/workable.ts) ---

interface WorkableWidgetJob {
  title: string;
  shortcode: string;
  employment_type: string;
  telecommuting: boolean;
  department: string | null;
  url: string;
  city: string;
  state: string;
  country: string;
}

interface WorkableWidgetResponse {
  name: string;
  description: string;
  jobs: WorkableWidgetJob[];
}

interface WorkableWidgetJobDetail {
  description: string;
  requirements: string;
  benefits: string;
}

interface JobsBoardJob {
  id: string;
  title: string;
  department: string | null;
  description: string;
  requirementsSection: string;
  benefitsSection: string;
  employmentType: string | null;
  workplace: string | null;
  url: string;
  location: { city: string; subregion: string; countryName: string } | null;
  locations: string[];
}

interface JobsBoardResponse {
  totalSize: number;
  nextPageToken: string | null;
  jobs: JobsBoardJob[];
}

export interface ParsedJobPayload {
  external_id: string;
  title: string;
  location: string | null;
  department: string | null;
  team: null;
  commitment: string | null;
  workplace_type: string | null;
  hosted_url: string | null;
  description_plain: string | null;
  japanese_level: null;
  role_category: null;
  tech_stack: null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchWidgetJobDetail(slug: string, shortcode: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://apply.workable.com/api/v2/accounts/${slug}/jobs/${shortcode}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const detail: WorkableWidgetJobDetail = await res.json();
    const parts = [detail.description, detail.requirements, detail.benefits]
      .filter(Boolean)
      .map(stripHtml);
    return parts.join("\n\n") || null;
  } catch {
    return null;
  }
}

const JOBS_BOARD_RE = /^https?:\/\/(?:www\.)?jobs\.workable\.com\/company\/([^/\s?#]+)/i;

function jobsBoardCompanyIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.trim().match(JOBS_BOARD_RE);
  return m?.[1] ?? null;
}

function extractSlugFromUrl(url: string): string | null {
  const patterns = [
    JOBS_BOARD_RE,
    /^https?:\/\/apply\.workable\.com\/api\/v1\/widget\/accounts\/([^/\s?#]+)/i,
    /^https?:\/\/(?:www\.)?apply\.workable\.com\/([^/\s?#]+)/i,
  ];
  for (const p of patterns) {
    const match = url.trim().match(p);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchFromJobsBoard(companyId: string): Promise<{ ok: true; jobs: ParsedJobPayload[] } | { ok: false; error: string }> {
  try {
    const allJobs: ParsedJobPayload[] = [];
    let pageToken: string | null = null;

    for (;;) {
      const apiUrl = pageToken
        ? `https://jobs.workable.com/api/v1/companies/${companyId}?pageToken=${encodeURIComponent(pageToken)}`
        : `https://jobs.workable.com/api/v1/companies/${companyId}`;

      const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const t = await res.text();
        return {
          ok: false,
          error: `Workable Jobs Board API returned ${res.status}: ${t.slice(0, 200)}`,
        };
      }

      const data: JobsBoardResponse = await res.json();

      for (const job of data.jobs) {
        const locParts = [
          job.location?.city,
          job.location?.subregion,
          job.location?.countryName,
        ].filter(Boolean);
        const location = locParts.join(", ") || (job.locations?.[0] ?? null);

        const descParts = [job.description, job.requirementsSection, job.benefitsSection]
          .filter(Boolean)
          .map(stripHtml);

        allJobs.push({
          external_id: job.id,
          title: job.title,
          location: location || null,
          department: job.department ?? null,
          team: null,
          commitment: job.employmentType || null,
          workplace_type: job.workplace || null,
          hosted_url: job.url ?? null,
          description_plain: descParts.join("\n\n") || null,
          japanese_level: null,
          role_category: null,
          tech_stack: null,
        });
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    return { ok: true, jobs: allJobs };
  } catch (err) {
    return {
      ok: false,
      error: `Failed to fetch Workable jobs: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function fetchFromWidgetApi(slug: string): Promise<{ ok: true; jobs: ParsedJobPayload[] } | { ok: false; error: string }> {
  try {
    const response = await fetch(
      `https://apply.workable.com/api/v1/widget/accounts/${slug}`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      return {
        ok: false,
        error: `Workable widget API returned ${response.status}: ${await response.text().then((t) => t.slice(0, 200))}`,
      };
    }

    const data: WorkableWidgetResponse = await response.json();

    const BATCH_SIZE = 5;
    const jobs: ParsedJobPayload[] = [];

    for (let i = 0; i < data.jobs.length; i += BATCH_SIZE) {
      const batch = data.jobs.slice(i, i + BATCH_SIZE);
      const details = await Promise.all(
        batch.map((job) => fetchWidgetJobDetail(slug, job.shortcode)),
      );

      for (let j = 0; j < batch.length; j++) {
        const job = batch[j];
        const location = [job.city, job.state, job.country].filter(Boolean).join(", ");

        jobs.push({
          external_id: job.shortcode,
          title: job.title,
          location: location || null,
          department: job.department ?? null,
          team: null,
          commitment: job.employment_type || null,
          workplace_type: job.telecommuting ? "remote" : null,
          hosted_url: job.url ?? null,
          description_plain: details[j],
          japanese_level: null,
          role_category: null,
          tech_stack: null,
        });
      }
    }

    return { ok: true, jobs };
  } catch (err) {
    return {
      ok: false,
      error: `Failed to fetch Workable jobs: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function scrapeWorkable(urlRaw: string): Promise<{ ok: true; jobs: ParsedJobPayload[] } | { ok: false; error: string }> {
  const url = urlRaw.trim();
  if (!url) return { ok: false, error: "Missing url" };

  const companyId = jobsBoardCompanyIdFromUrl(url);
  if (companyId) {
    return fetchFromJobsBoard(companyId);
  }

  const slug = extractSlugFromUrl(url);
  if (!slug) {
    return { ok: false, error: "Could not detect Workable company slug from URL" };
  }
  return fetchFromWidgetApi(slug);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const isAdmin = await verifyAdmin(req.headers.get("Authorization"));
  if (!isAdmin) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({})) as { url?: string };
    const url = typeof body.url === "string" ? body.url : "";
    const result = await scrapeWorkable(url);

    if (!result.ok) {
      return new Response(JSON.stringify({ success: false, jobs: [], error: result.error }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, jobs: result.jobs, error: null }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        jobs: [],
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
