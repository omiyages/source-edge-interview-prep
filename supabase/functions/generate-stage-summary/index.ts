// Server-side generation of Stage Summary (TL;DR, Testing Focus, Common Pitfalls).
// Generated ONCE per stage; regenerate only when stage content changes.
// Idempotency via content hash; fail gracefully returning existing or empty.
//
// Required secret: OPENAI_API_KEY (Supabase Dashboard → Edge Functions → generate-stage-summary → Secrets).

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifyClerkUser,
  unauthorizedResponse,
  appendCorsHeader,
  isAdminUserId,
} from "../_shared/clerkAuth.ts";

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

const SYSTEM_PROMPT = `You are an expert interview preparation coach. Analyze the course stage content and generate a concise, actionable summary.

Output valid JSON with this exact structure:
{
  "tldr_points": ["point1", "point2", "point3"],
  "testing_focus_quote": "A brief insightful quote about what interviewers really look for",
  "testing_focus_points": ["skill1", "skill2"],
  "common_pitfalls": ["pitfall1", "pitfall2", "pitfall3"]
}

Rules:
- tldr_points: 3-4 bullet points, each under 25 words. Use **bold** for key terms. Focus on actionable takeaways.
- testing_focus_quote: 1-2 sentences max, written as if from an interviewer's perspective
- testing_focus_points: 2-4 skills/competencies being evaluated
- common_pitfalls: 2-5 frequent mistakes candidates make, concise phrases
- Be specific to the content provided, avoid generic advice
- Minimize words while maximizing value`;

function buildUserPrompt(stage: {
  title: string;
  description: string | null;
  information: string | null;
}): string {
  // Strip HTML tags from information
  const cleanInfo = stage.information 
    ? stage.information.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';
  
  return [
    `Stage Title: ${stage.title}`,
    `Description: ${stage.description || 'N/A'}`,
    `Content:\n${cleanInfo || 'No detailed content provided'}`,
  ].join("\n\n");
}

async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface StageSummaryOutput {
  tldr_points: string[];
  testing_focus_quote: string;
  testing_focus_points: string[];
  common_pitfalls: string[];
}

function parseSummaryJson(raw: string): StageSummaryOutput | null {
  try {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    
    const tldr_points = Array.isArray(parsed.tldr_points)
      ? parsed.tldr_points.filter((x): x is string => typeof x === "string").map((s) => s.trim()).slice(0, 4)
      : [];
    
    const testing_focus_quote = typeof parsed.testing_focus_quote === "string" 
      ? parsed.testing_focus_quote.trim() 
      : "";
    
    const testing_focus_points = Array.isArray(parsed.testing_focus_points)
      ? parsed.testing_focus_points.filter((x): x is string => typeof x === "string").map((s) => s.trim()).slice(0, 5)
      : [];
    
    const common_pitfalls = Array.isArray(parsed.common_pitfalls)
      ? parsed.common_pitfalls.filter((x): x is string => typeof x === "string").map((s) => s.trim()).slice(0, 5)
      : [];
    
    if (tldr_points.length === 0) return null;
    
    return {
      tldr_points,
      testing_focus_quote,
      testing_focus_points,
      common_pitfalls,
    };
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return forwarded.split(",")[0].trim().slice(0, 64);
}

Deno.serve(async (req) => {
  const corsHeaders = appendCorsHeader(getCorsHeaders(req.headers.get("origin")));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyClerkUser(req);
  if (!auth.ok) return unauthorizedResponse(corsHeaders, auth.error);
  const userId = auth.userId;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const actorKey = `${userId}:${getClientIp(req)}`;
  const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
    operation_name: 'ai_generate_stage_summary',
    max_attempts: 30,
    window_minutes: 60,
    actor_key: actorKey,
  });
  if (rateLimitError || !rateLimitOk) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let stageId: string;
  let forceRegenerate = false;
  
  try {
    const body = await req.json();
    stageId = body?.stage_id;
    forceRegenerate = body?.force === true;
    
    if (!stageId || typeof stageId !== "string") {
      return new Response(
        JSON.stringify({ error: "stage_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Fetch stage content
  const { data: stage, error: stageError } = await supabase
    .from("course_stages")
    .select("id, title, description, information")
    .eq("id", stageId)
    .single();

  if (stageError || !stage) {
    return new Response(
      JSON.stringify({ error: "Stage not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate content hash
  const contentForHash = `${stage.title}|${stage.description || ''}|${stage.information || ''}`;
  const contentHash = await sha256Hex(contentForHash);

  // Check existing summary
  const { data: existingSummary } = await supabase
    .from("stage_summaries")
    .select("*")
    .eq("stage_id", stageId)
    .single();

  // Return existing if hash matches and not forcing regeneration
  if (existingSummary && existingSummary.content_hash === contentHash && !forceRegenerate) {
    return new Response(
      JSON.stringify({
        tldr_points: existingSummary.tldr_points || [],
        testing_focus_quote: existingSummary.testing_focus_quote || "",
        testing_focus_points: existingSummary.testing_focus_points || [],
        common_pitfalls: existingSummary.common_pitfalls || [],
        cached: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const canGenerate = await isAdminUserId(userId);
  if (!canGenerate) {
    return new Response(
      JSON.stringify({
        tldr_points: existingSummary?.tldr_points || [],
        testing_focus_quote: existingSummary?.testing_focus_quote || "",
        testing_focus_points: existingSummary?.testing_focus_points || [],
        common_pitfalls: existingSummary?.common_pitfalls || [],
        error: "Insufficient permissions to generate stage summary",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if OpenAI is configured
  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        tldr_points: existingSummary?.tldr_points || [],
        testing_focus_quote: existingSummary?.testing_focus_quote || "",
        testing_focus_points: existingSummary?.testing_focus_points || [],
        common_pitfalls: existingSummary?.common_pitfalls || [],
        error: "OpenAI not configured",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate with OpenAI
  try {
    const userPrompt = buildUserPrompt({
      title: stage.title,
      description: stage.description,
      information: stage.information,
    });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      return new Response(
        JSON.stringify({
          tldr_points: existingSummary?.tldr_points || [],
          testing_focus_quote: existingSummary?.testing_focus_quote || "",
          testing_focus_points: existingSummary?.testing_focus_points || [],
          common_pitfalls: existingSummary?.common_pitfalls || [],
          error: "Generation failed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseSummaryJson(content);

    if (!parsed) {
      console.error("Failed to parse OpenAI response:", content);
      return new Response(
        JSON.stringify({
          tldr_points: existingSummary?.tldr_points || [],
          testing_focus_quote: existingSummary?.testing_focus_quote || "",
          testing_focus_points: existingSummary?.testing_focus_points || [],
          common_pitfalls: existingSummary?.common_pitfalls || [],
          error: "Invalid response format",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert the summary
    const summaryData = {
      stage_id: stageId,
      tldr_points: parsed.tldr_points,
      testing_focus_quote: parsed.testing_focus_quote,
      testing_focus_points: parsed.testing_focus_points,
      common_pitfalls: parsed.common_pitfalls,
      content_hash: contentHash,
    };

    if (existingSummary) {
      await supabase
        .from("stage_summaries")
        .update(summaryData)
        .eq("id", existingSummary.id);
    } else {
      await supabase
        .from("stage_summaries")
        .insert(summaryData);
    }

    return new Response(
      JSON.stringify({
        tldr_points: parsed.tldr_points,
        testing_focus_quote: parsed.testing_focus_quote,
        testing_focus_points: parsed.testing_focus_points,
        common_pitfalls: parsed.common_pitfalls,
        generated: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-stage-summary error:", err);
    return new Response(
      JSON.stringify({
        tldr_points: existingSummary?.tldr_points || [],
        testing_focus_quote: existingSummary?.testing_focus_quote || "",
        testing_focus_points: existingSummary?.testing_focus_points || [],
        common_pitfalls: existingSummary?.common_pitfalls || [],
        error: err instanceof Error ? err.message : "Generation failed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
