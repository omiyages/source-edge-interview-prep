// Generate a concise AI candidate-fit summary for a role listing.
// Generated ONCE per role; regenerated only when role content changes.
// Idempotency via SHA-256 content hash stored alongside the summary.
//
// Required secret: OPENAI_API_KEY (Supabase Dashboard → Edge Functions → Secrets).

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifyClerkUser,
  unauthorizedResponse,
  appendCorsHeader,
} from "../_shared/clerkAuth.ts";
import { checkActorRateLimit } from "../_shared/rateLimit.ts";

const OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_MAX_RETRIES = 2;

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
    "Vary": "Origin",
  };
}

const SYSTEM_PROMPT = `You are a concise recruiting copywriter. Given a job listing, output valid JSON with exactly two fields:
{"candidate":"...","responsibility":"..."}
Rules:
- "candidate": One sentence (max 25 words) describing who the ideal candidate is. Focus on distinctive skills/experience.
- "responsibility": One sentence (max 25 words) summarizing the core job responsibility. Focus on what they will do day-to-day.
- Output ONLY the JSON object, nothing else.`;

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildUserPrompt(role: {
  job_title: string;
  company: string;
  division: string | null;
  requirements: string | null;
  nice_to_haves: string | null;
  job_description: string | null;
}): string {
  const parts = [`Role: ${role.job_title} at ${role.company}`];
  if (role.division) parts.push(`Division: ${role.division}`);
  const reqs = stripHtml(role.requirements);
  if (reqs) parts.push(`Requirements: ${reqs.slice(0, 500)}`);
  const nice = stripHtml(role.nice_to_haves);
  if (nice) parts.push(`Nice to haves: ${nice.slice(0, 300)}`);
  const desc = stripHtml(role.job_description);
  if (desc) parts.push(`Description: ${desc.slice(0, 400)}`);
  return parts.join("\n");
}

async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return forwarded.split(",")[0].trim().slice(0, 64);
}

function isActiveRole(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === "active";
}

function parseSummaryContent(raw: string): string {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return JSON.stringify({
      candidate: (parsed.candidate || "").trim(),
      responsibility: (parsed.responsibility || "").trim(),
    });
  } catch {
    return JSON.stringify({ candidate: raw.trim(), responsibility: "" });
  }
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ").trim()}…`;
}

function firstMeaningfulSentence(text: string | null, maxWords = 25): string {
  const clean = stripHtml(text);
  if (!clean) return "";
  const sentence = clean.match(/[^.!?\n]+[.!?]/)?.[0]?.trim() ?? clean;
  return truncateWords(sentence, maxWords);
}

function buildFallbackSummary(role: {
  job_title: string;
  company: string;
  requirements: string | null;
  job_description: string | null;
}): string {
  const fromReqs = firstMeaningfulSentence(role.requirements);
  const fromDesc = firstMeaningfulSentence(role.job_description);

  const candidate = fromReqs
    ? `Ideal candidate: ${fromReqs}`
    : `Experienced ${role.job_title} with skills aligned to ${role.company}'s needs.`;

  const responsibility = fromDesc
    ? fromDesc
    : `Join ${role.company} as ${role.job_title} and help deliver on core product goals.`;

  return JSON.stringify({
    candidate: truncateWords(candidate, 25),
    responsibility: truncateWords(responsibility, 25),
  });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithOpenAI(
  openaiKey: string,
  userPrompt: string,
): Promise<{ raw: string | null; error: string | null }> {
  let lastError = "Generation failed";

  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 200,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `OpenAI ${res.status}: ${errText.slice(0, 200)}`;
        console.error("OpenAI error:", res.status, errText);
        if (attempt < OPENAI_MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        return { raw: null, error: lastError };
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = (data?.choices?.[0]?.message?.content ?? "").trim();
      if (!raw) {
        lastError = "Empty OpenAI response";
        if (attempt < OPENAI_MAX_RETRIES) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        return { raw: null, error: lastError };
      }
      return { raw, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error("OpenAI fetch error:", lastError);
      if (attempt < OPENAI_MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
    }
  }

  return { raw: null, error: lastError };
}

Deno.serve(async (req) => {
  const corsHeaders = appendCorsHeader(getCorsHeaders(req.headers.get("origin")));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let roleId: string;
  let forceRegenerate = false;

  try {
    const body = await req.json();
    roleId = body?.role_id;
    forceRegenerate = body?.force === true;

    if (!roleId || typeof roleId !== "string") {
      return new Response(
        JSON.stringify({ error: "role_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select(
      "id, job_title, company, division, job_description, requirements, nice_to_haves, ai_summary, content_hash, status"
    )
    .eq("id", roleId)
    .single();

  if (roleError || !role) {
    return new Response(
      JSON.stringify({ error: "Role not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const contentForHash = [
    role.job_title,
    role.company,
    role.division || "",
    stripHtml(role.job_description),
    stripHtml(role.requirements),
    stripHtml(role.nice_to_haves),
  ].join("|");
  const contentHash = await sha256Hex(contentForHash);

  if (
    role.ai_summary &&
    role.content_hash === contentHash &&
    !forceRegenerate
  ) {
    return new Response(
      JSON.stringify({ ai_summary: role.ai_summary, cached: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const auth = await verifyClerkUser(req);
  const clientIp = getClientIp(req);
  const missingSummary = !role.ai_summary;
  const contentChanged = !!role.ai_summary && role.content_hash !== contentHash;

  if (forceRegenerate || contentChanged) {
    if (!auth.ok) return unauthorizedResponse(corsHeaders, auth.error);
  } else if (missingSummary) {
    if (!isActiveRole(role.status)) {
      if (!auth.ok) return unauthorizedResponse(corsHeaders, auth.error);
    }
  }

  const actorKey = auth.ok ? `${auth.userId}:${clientIp}` : `anon:${clientIp}`;
  const rateLimitOk = await checkActorRateLimit(
    supabase,
    actorKey,
    "ai_generate_role_summary",
    30,
    60,
  );
  if (!rateLimitOk) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        ai_summary: role.ai_summary || null,
        error: "OpenAI not configured",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const userPrompt = buildUserPrompt({
    job_title: role.job_title,
    company: role.company,
    division: role.division,
    requirements: role.requirements,
    nice_to_haves: role.nice_to_haves,
    job_description: role.job_description,
  });

  const { raw, error: openaiError } = await generateWithOpenAI(openaiKey, userPrompt);
  const summaryJson = raw
    ? parseSummaryContent(raw)
    : buildFallbackSummary({
      job_title: role.job_title,
      company: role.company,
      requirements: role.requirements,
      job_description: role.job_description,
    });

  if (!raw) {
    console.warn("Using fallback summary for role", roleId, openaiError);
  }

  const { error: updateError } = await supabase
    .from("roles")
    .update({ ai_summary: summaryJson, content_hash: contentHash } as any)
    .eq("id", roleId);

  if (updateError) {
    console.error("Failed to persist ai_summary:", updateError.message);
    return new Response(
      JSON.stringify({
        ai_summary: role.ai_summary || null,
        error: "Failed to save summary",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      ai_summary: summaryJson,
      generated: !!raw,
      fallback: !raw,
      ...(raw ? {} : { warning: openaiError || "OpenAI unavailable; used content-based fallback" }),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
