import { createClient } from "npm:@supabase/supabase-js@2";

const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 25_000;
// Edge Functions can be terminated around ~150s; keep each click bounded.
const MAX_CHAR_BUDGET_PER_BATCH = 9_000;
const MAX_BATCHES_PER_REQUEST = 3;

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

function looksJapanese(text: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

function safeString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

type JobRow = {
  company: string;
  ats_platform: string;
  external_id: string;
  title: string;
  description_plain: string | null;
  location: string | null;
  commitment: string | null;
  title_ja: string | null;
  description_plain_ja: string | null;
  location_ja: string | null;
  commitment_ja: string | null;
  translation_status: "pending" | "done" | "error" | "skipped";
};

type Translatable = {
  key: string;
  title: string;
  description: string | null;
  location: string | null;
  commitment: string | null;
  tech_stack: string | null;
};

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

async function translateBatch(openaiKey: string, batch: Translatable[]): Promise<Map<string, Translatable>> {
  const out = new Map<string, Translatable>();
  batch.forEach((b) => out.set(b.key, b));

  const body = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          'You are helping normalize job postings for a recruiting database.\n\nTask:\n1) Translate Japanese job posting fields into natural, professional English. Preserve meaning. Keep URLs, numbers, product names, and acronyms unchanged.\n2) Extract the tech stack from the posting and return it as a concise comma-separated list (e.g. "Python, AWS, Kubernetes, React"). If unclear, return null.\n\nReturn STRICT JSON only with shape:\n{ "jobs": [ { "key": string, "title": string, "description": string|null, "location": string|null, "commitment": string|null, "tech_stack": string|null } ] }\nDo not wrap in markdown.',
      },
      { role: "user", content: JSON.stringify({ jobs: batch }) },
    ],
    temperature: 0.2,
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(t));

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("translate_bd_jobs_openai_failed", { status: res.status, body: errText.slice(0, 500) });
    return out;
  }

  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return out;

  try {
    const parsed = JSON.parse(content) as { jobs?: unknown };
    if (!Array.isArray(parsed.jobs)) return out;
    for (const item of parsed.jobs) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;
      const key = safeString(obj.key);
      if (!key) continue;
      const prev = out.get(key);
      if (!prev) continue;
      out.set(key, {
        key,
        title: safeString(obj.title) ?? prev.title,
        description: safeString(obj.description) ?? prev.description,
        location: safeString(obj.location) ?? prev.location,
        commitment: safeString(obj.commitment) ?? prev.commitment,
        tech_stack: safeString(obj.tech_stack) ?? prev.tech_stack,
      });
    }
  } catch {
    return out;
  }

  return out;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("translate_bd_company_jobs_missing_supabase_secrets", {
      hasUrl: Boolean(supabaseUrl),
      hasServiceRole: Boolean(supabaseServiceKey),
    });
    return new Response(JSON.stringify({ success: false, error: "Supabase service key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  const { company, limit = 50 } = (await req.json().catch(() => ({}))) as { company?: string; limit?: number };
  const companyName = typeof company === "string" ? company.trim() : "";

  if (!companyName) {
    return new Response(JSON.stringify({ success: false, error: "company required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("bd_company_jobs")
    .select(
      "company, ats_platform, external_id, title, description_plain, location, commitment, title_ja, description_plain_ja, location_ja, commitment_ja, translation_status",
    )
    .eq("company", companyName)
    .eq("translation_status", "pending")
    .order("updated_at", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 80));

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows = (data || []) as JobRow[];
  const candidates = rows.filter((r) => {
    const joined = [r.title_ja ?? r.title, r.description_plain_ja ?? "", r.location_ja ?? "", r.commitment_ja ?? ""].join("\n");
    return looksJapanese(joined);
  });

  if (candidates.length === 0) {
    return new Response(JSON.stringify({ success: true, translated: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!openaiKey) {
    return new Response(JSON.stringify({ success: false, error: "OpenAI not configured" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload: Translatable[] = candidates.map((r) => ({
    key: `${r.company}:${r.ats_platform}:${r.external_id}`,
    title: r.title_ja ?? r.title,
    description: r.description_plain_ja ?? r.description_plain,
    location: r.location_ja ?? r.location,
    commitment: r.commitment_ja ?? r.commitment,
    tech_stack: null,
  }));

  const chunks = chunkByCharBudget(
    payload,
    MAX_CHAR_BUDGET_PER_BATCH,
    (j) => `${j.key}\n${j.title}\n${j.location ?? ""}\n${j.commitment ?? ""}\n${j.description ?? ""}\n`,
  ).slice(0, MAX_BATCHES_PER_REQUEST);
  const now = new Date().toISOString();
  let updatedCount = 0;

  for (const batch of chunks) {
    const translated = await translateBatch(openaiKey, batch);
    const updates = batch.map((b) => {
      const t = translated.get(b.key) ?? b;
      const [_c, _p, id] = b.key.split(":");
      return {
        company: companyName,
        ats_platform: _p,
        external_id: id,
        title: t.title,
        description_plain: t.description,
        location: t.location,
        commitment: t.commitment,
        tech_stack: t.tech_stack,
        translation_status: "done",
        translated_at: now,
        translation_error: null,
      };
    });
    const { error: upErr } = await supabase
      .from("bd_company_jobs")
      .upsert(updates, { onConflict: "company,ats_platform,external_id" });
    if (upErr) console.error("translate_bd_company_jobs_upsert_failed", upErr);
    updatedCount += updates.length;
  }

  return new Response(
    JSON.stringify({
      success: true,
      translated: updatedCount,
      // If there are more pending jobs, the user can click again.
      remaining_pending_hint: Math.max(0, candidates.length - updatedCount),
    }),
    {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

