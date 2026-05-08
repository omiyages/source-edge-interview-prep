import { createClient } from "npm:@supabase/supabase-js@2";

const OPENAI_MODEL = "gpt-4o-mini";

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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

type RoleRow = {
  id: string;
  job_title: string;
  job_description: string | null;
  location: string;
  job_title_ja: string | null;
  job_description_ja: string | null;
  location_ja: string | null;
  commitment_ja: string | null;
  translation_status: "pending" | "done" | "error" | "skipped";
};

type TranslatableRole = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  commitment: string | null;
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

async function translateBatch(openaiKey: string, batch: TranslatableRole[]): Promise<Map<string, TranslatableRole>> {
  const out = new Map<string, TranslatableRole>();
  batch.forEach((b) => out.set(b.id, b));

  const body = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          'Translate Japanese job posting fields into natural, professional English for a job board. Preserve meaning. Keep URLs, numbers, product names, and acronyms unchanged.\n\nReturn STRICT JSON only with shape:\n{ "jobs": [ { "id": string, "title": string, "description": string|null, "location": string|null, "commitment": string|null } ] }\nDo not wrap in markdown.',
      },
      { role: "user", content: JSON.stringify({ jobs: batch }) },
    ],
    temperature: 0.2,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("translate_pending_roles_openai_failed", { status: res.status, body: errText.slice(0, 500) });
    return out;
  }

  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    console.error("translate_pending_roles_openai_missing_content");
    return out;
  }

  try {
    const parsed = JSON.parse(content) as { jobs?: unknown };
    if (!Array.isArray(parsed.jobs)) {
      console.error("translate_pending_roles_openai_bad_shape", { preview: content.slice(0, 500) });
      return out;
    }
    for (const item of parsed.jobs) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;
      const id = safeString(obj.id);
      if (!id) continue;
      const prev = out.get(id);
      if (!prev) continue;
      out.set(id, {
        id,
        title: safeString(obj.title) ?? prev.title,
        description: safeString(obj.description) ?? prev.description,
        location: safeString(obj.location) ?? prev.location,
        commitment: safeString(obj.commitment) ?? prev.commitment,
      });
    }
  } catch {
    console.error("translate_pending_roles_openai_bad_json", { preview: content.slice(0, 500) });
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

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return new Response(JSON.stringify({ success: false, error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const got = req.headers.get("x-cron-secret");
  if (got !== cronSecret) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  const { limit = 50 } = (await req.json().catch(() => ({}))) as { limit?: number };

  try {
    // Find pending roles that actually look Japanese in stored JP originals.
    const { data, error } = await supabase
      .from("roles")
      .select(
        "id, job_title, job_description, location, job_title_ja, job_description_ja, location_ja, commitment_ja, translation_status",
      )
      .eq("translation_status", "pending")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 200));

    if (error) throw error;

    const rows = (data || []) as RoleRow[];
    const candidates = rows.filter((r) => {
      const joined = [r.job_title_ja ?? "", r.job_description_ja ?? "", r.location_ja ?? "", r.commitment_ja ?? ""].join(
        "\n",
      );
      return looksJapanese(joined);
    });

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ success: true, translated: 0, skipped: rows.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!openaiKey) {
      // No OpenAI configured → mark as error so we don't loop forever.
      await supabase
        .from("roles")
        .update({ translation_status: "error", translation_error: "OpenAI not configured" })
        .in(
          "id",
          candidates.map((c) => c.id),
        );
      return new Response(JSON.stringify({ success: false, error: "OpenAI not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: TranslatableRole[] = candidates.map((r) => ({
      id: r.id,
      title: r.job_title_ja ?? r.job_title,
      description: r.job_description_ja ?? r.job_description,
      location: r.location_ja ?? r.location,
      commitment: r.commitment_ja ?? null,
    }));

    const chunks = chunkByCharBudget(
      payload,
      18_000,
      (j) => `${j.id}\n${j.title}\n${j.location ?? ""}\n${j.commitment ?? ""}\n${j.description ?? ""}\n`,
    );

    const updates: Array<{ id: string; job_title: string; job_description: string | null; location: string; translation_status: string; translated_at: string }> =
      [];

    for (const batch of chunks) {
      const translated = await translateBatch(openaiKey, batch);
      for (const item of batch) {
        const t = translated.get(item.id) ?? item;
        updates.push({
          id: item.id,
          job_title: t.title,
          job_description: t.description,
          location: t.location ?? candidates.find((c) => c.id === item.id)?.location ?? "Japan",
          translation_status: "done",
          translated_at: new Date().toISOString(),
        });
      }
    }

    const { error: upErr } = await supabase.from("roles").upsert(updates, { onConflict: "id" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ success: true, translated: updates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

