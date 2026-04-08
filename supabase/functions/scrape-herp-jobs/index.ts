/**
 * Server-side HERP fetch — herp.careers pages may block browser CORS; this function
 * proxies listing + job detail fetches and extracts embedded JSON props.
 *
 * Auth: Clerk JWT + profiles.role === admin (same pattern as scrape-workable-jobs).
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") ?? null;
const OPENAI_MODEL = "gpt-4o-mini";

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
    Vary: "Origin",
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
  japanese_level:
    | "None"
    | "Conversational"
    | "Business"
    | "Native"
    | "Nice to Have"
    | null;
  role_category: null;
  tech_stack: string | null;
}

function looksJapanese(text: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

function detectJapaneseLevelFromText(text: string): ParsedJobPayload["japanese_level"] {
  const t = text.toLowerCase();
  const hasJapaneseKeyword = /日本語|japanese/.test(text);
  if (!hasJapaneseKeyword) return null;

  if (/母語|ネイティブ/.test(text) || /\bnative\b/.test(t) || /\bfluent\b/.test(t)) return "Native";
  if (/\bjlpt\b/.test(t) && /\bn1\b/.test(t)) return "Business";
  if (/\bjlpt\b/.test(t) && /\bn2\b/.test(t)) return "Conversational";
  if (/n1/.test(text) || /日本語.*(必須|必)?/.test(text) || /\bbusiness\b/.test(t) || /\bprofessional\b/.test(t)) {
    return "Business";
  }
  if (/\bconversational\b/.test(t) || /日常会話/.test(text) || /n2/.test(text)) return "Conversational";
  if (/不要|not\s*required|nice\s*to\s*have|歓迎|尚可/.test(text) || /\bplus\b/.test(t)) return "Nice to Have";

  return "Business";
}

interface TechPattern {
  label: string;
  pattern: RegExp;
}

const ANY_LANGUAGE_RE =
  /any\s+(?:programming|coding)\s+language|language[\s-]*agnostic/i;

const TECH_PATTERNS: TechPattern[] = [
  { label: "Python", pattern: /\bpython\b/i },
  { label: "Java", pattern: /\bjava\b(?!\s*script)/i },
  { label: "Scala", pattern: /\bscala\b/i },
  { label: "Go", pattern: /\bgolang\b|\bgo\s+(?:lang|programming|language|modules?|routines?)\b/i },
  { label: "Rust", pattern: /\brust\b/i },
  { label: "C++", pattern: /\bc\+\+\b/i },
  { label: "C#", pattern: /\bc#\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b|\bjs\b/i },
  { label: "TypeScript", pattern: /\btypescript\b|\bts\b/i },
  { label: "Ruby", pattern: /\bruby\b/i },
  { label: "PHP", pattern: /\bphp\b/i },
  { label: "Kotlin", pattern: /\bkotlin\b/i },
  { label: "Swift", pattern: /\bswift\b/i },
  { label: "SQL", pattern: /\bsql\b/i },
  { label: "React", pattern: /\breact(?:\.?js)?\b/i },
  { label: "Vue", pattern: /\bvue(?:\.?js)?\b/i },
  { label: "Next.js", pattern: /\bnext\.?js\b/i },
  { label: "Node.js", pattern: /\bnode\.?js\b/i },
  { label: "Rails", pattern: /\brails\b|\bruby\s+on\s+rails\b/i },
  { label: "Django", pattern: /\bdjango\b/i },
  { label: "FastAPI", pattern: /\bfastapi\b/i },
  { label: "GraphQL", pattern: /\bgraphql\b/i },
  { label: "Kubernetes", pattern: /\bkubernetes\b|\bk8s\b/i },
  { label: "Docker", pattern: /\bdocker\b/i },
  { label: "Terraform", pattern: /\bterraform\b/i },
  { label: "AWS", pattern: /\baws\b/i },
  { label: "GCP", pattern: /\bgcp\b|\bgoogle\s+cloud\b/i },
  { label: "Azure", pattern: /\bazure\b/i },
  { label: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "MySQL", pattern: /\bmysql\b/i },
  { label: "Redis", pattern: /\bredis\b/i },
  { label: "Elasticsearch", pattern: /\belasticsearch\b|\belastic\s+search\b/i },
  { label: "Datadog", pattern: /\bdatadog\b/i },
];

function extractTechStackFromText(text: string): string | null {
  if (!text.trim()) return null;
  if (ANY_LANGUAGE_RE.test(text)) return "Any";

  const found = new Set<string>();
  for (const { label, pattern } of TECH_PATTERNS) {
    if (pattern.test(text)) found.add(label);
  }
  if (found.has("Ruby") && found.has("Rails")) found.delete("Ruby");

  if (found.size === 0) return null;
  return [...found].join(", ");
}

type TranslatableJob = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  commitment: string | null;
};

type TranslatedJob = TranslatableJob;

function shouldTranslateJob(j: TranslatableJob): boolean {
  const joined = [j.title, j.description ?? "", j.location ?? "", j.commitment ?? ""].join("\n");
  return looksJapanese(joined);
}

function chunkByCharBudget<T>(items: T[], budget: number, toText: (item: T) => string): T[][] {
  const chunks: T[][] = [];
  let cur: T[] = [];
  let curSize = 0;

  for (const item of items) {
    const size = toText(item).length;
    if (cur.length > 0 && curSize + size > budget) {
      chunks.push(cur);
      cur = [];
      curSize = 0;
    }
    cur.push(item);
    curSize += size;
  }

  if (cur.length) chunks.push(cur);
  return chunks;
}

async function translateJobsToEnglish(jobs: TranslatableJob[]): Promise<Map<string, TranslatedJob>> {
  const out = new Map<string, TranslatedJob>();
  for (const j of jobs) out.set(j.id, j);

  const toTranslate = jobs.filter(shouldTranslateJob);
  if (toTranslate.length === 0) return out;

  if (!openaiApiKey) {
    console.error("openai_translate_missing_key");
    return out;
  }

  // Keep requests bounded to reduce timeouts and token overflows.
  // This is a rough budget; OpenAI tokenization differs but this works well in practice.
  const chunks = chunkByCharBudget(
    toTranslate,
    18_000,
    (j) => `${j.id}\n${j.title}\n${j.location ?? ""}\n${j.commitment ?? ""}\n${j.description ?? ""}\n`,
  );

  console.log("openai_translate_batches", { jobs: toTranslate.length, batches: chunks.length });

  for (const batch of chunks) {
    const body = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Translate job posting fields into natural, professional English for a job board. Preserve meaning. Keep URLs, numbers, product names, and acronyms unchanged.\n\nReturn STRICT JSON only with shape:\n{ \"jobs\": [ { \"id\": string, \"title\": string, \"description\": string|null, \"location\": string|null, \"commitment\": string|null } ] }\nDo not wrap in markdown.",
        },
        {
          role: "user",
          content: JSON.stringify({ jobs: batch }),
        },
      ],
      temperature: 0.2,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("openai_translate_failed", {
        status: res.status,
        statusText: res.statusText,
        body: errText.slice(0, 500),
      });
      continue;
    }

    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      console.error("openai_translate_missing_content");
      continue;
    }

    try {
      const parsed = JSON.parse(content) as { jobs?: unknown };
      if (!Array.isArray(parsed.jobs)) {
        console.error("openai_translate_bad_shape", { preview: content.slice(0, 500) });
        continue;
      }

      for (const item of parsed.jobs) {
        if (!item || typeof item !== "object") continue;
        const id = safeString((item as Record<string, unknown>)["id"]);
        if (!id) continue;

        const prev = out.get(id);
        if (!prev) continue;

        out.set(id, {
          id,
          title: safeString((item as Record<string, unknown>)["title"]) ?? prev.title,
          description: safeString((item as Record<string, unknown>)["description"]) ?? prev.description,
          location: safeString((item as Record<string, unknown>)["location"]) ?? prev.location,
          commitment: safeString((item as Record<string, unknown>)["commitment"]) ?? prev.commitment,
        });
      }
    } catch {
      console.error("openai_translate_bad_json", { preview: content.slice(0, 500) });
      continue;
    }
  }

  return out;
}

function normalizeHerpListingUrl(rawUrl: string): { companySlug: string; url: string } {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Invalid URL protocol");
  if (u.hostname !== "herp.careers") throw new Error("URL must be on herp.careers");

  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2 || parts[0] !== "v1") throw new Error("URL must start with /v1/<company>");
  const companySlug = parts[1];
  if (!companySlug) throw new Error("Missing company slug");

  return { companySlug, url: `https://herp.careers/v1/${companySlug}` };
}

function extractDetailIdsFromListingHtml(
  html: string,
  companySlug: string,
): { id: string; url: string }[] {
  const out: { id: string; url: string }[] = [];
  const seen = new Set<string>();

  // Matches: href="/v1/<company>/<careerPageId>"
  const re = /href="\/v1\/([^/"\s?#]+)\/([A-Za-z0-9_-]+)"/g;
  for (const match of html.matchAll(re)) {
    const slug = match[1];
    const id = match[2];
    if (!slug || !id) continue;
    if (slug !== companySlug) continue;
    if (id === "requisition-groups") continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, url: `https://herp.careers/v1/${companySlug}/${id}` });
  }

  return out;
}

function extractHerpReactPropsJson(html: string): string | null {
  const re =
    /<script[^>]*id="herp-react-props"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i;
  const m = html.match(re);
  return m?.[1] ?? null;
}

function pickDepartment(groupNameList: unknown): string | null {
  if (!Array.isArray(groupNameList)) return null;
  const skip = new Set(["正社員", "契約社員", "業務委託", "アルバイト", "パート", "インターン"]);
  for (const item of groupNameList) {
    if (!item || typeof item !== "object") continue;
    const name = (item as Record<string, unknown>)["name"];
    if (typeof name !== "string") continue;
    const trimmed = name.trim();
    if (!trimmed) continue;
    if (skip.has(trimmed)) continue;
    return trimmed;
  }
  return null;
}

function isClosedTitle(title: string): boolean {
  return title.trim().startsWith("＜終了＞");
}

function safeString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function mapHerpPropsToJob(props: Record<string, unknown>, companySlug: string): ParsedJobPayload | null {
  const careerPageId = safeString(props["careerPageId"]);
  const title = safeString(props["name"]);
  if (!careerPageId || !title) return null;
  if (isClosedTitle(title)) return null;

  const summary = props["summary"];
  const summaryText =
    summary && typeof summary === "object"
      ? safeString((summary as Record<string, unknown>)["text"])
      : null;

  const location = props["location"];
  const locationText =
    location && typeof location === "object"
      ? safeString((location as Record<string, unknown>)["text"])
      : null;

  const hostedUrl =
    safeString(props["canonicalUrl"]) ?? `https://herp.careers/v1/${companySlug}/${careerPageId}`;

  const commitment = safeString(props["formOfEmployment"]);

  const department = pickDepartment(props["careerPageGroupNameList"]);

  return {
    external_id: careerPageId,
    title,
    location: locationText,
    department,
    team: null,
    commitment,
    workplace_type: null,
    hosted_url: hostedUrl,
    description_plain: summaryText,
    japanese_level: detectJapaneseLevelFromText([title, summaryText ?? "", locationText ?? ""].join("\n")) ?? "None",
    role_category: null,
    tech_stack: extractTechStackFromText([title, summaryText ?? ""].join(" ")) ?? null,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authed = await verifyAdmin(req.headers.get("authorization"));
  if (!authed) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("scrape_herp_jobs_invoked");
    const { url } = (await req.json()) as { url?: string };
    if (!url) throw new Error("Missing url");

    const { companySlug, url: listingUrl } = normalizeHerpListingUrl(url);
    console.log("scrape_herp_jobs_target", { companySlug });

    const listingRes = await fetch(listingUrl, {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    if (!listingRes.ok) {
      throw new Error(`HERP listing returned ${listingRes.status}: ${listingRes.statusText}`);
    }
    const listingHtml = await listingRes.text();

    const detailTargets = extractDetailIdsFromListingHtml(listingHtml, companySlug);
    if (!detailTargets.length) {
      return new Response(JSON.stringify({ success: true, jobs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("scrape_herp_jobs_details_found", { count: detailTargets.length });

    const detailJobs = await mapWithConcurrency(detailTargets, 6, async (t) => {
      const res = await fetch(t.url, { headers: { Accept: "text/html,application/xhtml+xml" } });
      if (!res.ok) return null;
      const html = await res.text();
      const jsonRaw = extractHerpReactPropsJson(html);
      if (!jsonRaw) return null;
      let props: Record<string, unknown>;
      try {
        props = JSON.parse(jsonRaw) as Record<string, unknown>;
      } catch {
        return null;
      }
      const baseJob = mapHerpPropsToJob(props, companySlug);
      if (!baseJob) return null;
      return baseJob;
    });

    const baseJobs = detailJobs.filter((j): j is ParsedJobPayload => Boolean(j));
    const translationMap = await translateJobsToEnglish(
      baseJobs.map((j) => ({
        id: j.external_id,
        title: j.title,
        description: j.description_plain,
        location: j.location,
        commitment: j.commitment,
      })),
    );

    const jobs = baseJobs.map((baseJob) => {
      const translated = translationMap.get(baseJob.external_id);
      const title = translated?.title ?? baseJob.title;
      const description = translated?.description ?? baseJob.description_plain;
      const location = translated?.location ?? baseJob.location;
      const commitment = translated?.commitment ?? baseJob.commitment;

      const combinedForHeuristics = [
        baseJob.title,
        baseJob.description_plain ?? "",
        baseJob.location ?? "",
        title,
        description ?? "",
        location ?? "",
      ].join("\n");

      return {
        ...baseJob,
        title,
        description_plain: description,
        location,
        commitment,
        japanese_level: detectJapaneseLevelFromText(combinedForHeuristics) ?? baseJob.japanese_level,
        tech_stack:
          extractTechStackFromText([title, description ?? "", baseJob.title, baseJob.description_plain ?? ""].join(" ")) ??
          baseJob.tech_stack,
      };
    });
    console.log("scrape_herp_jobs_done", { returned: jobs.length });

    return new Response(JSON.stringify({ success: true, jobs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

