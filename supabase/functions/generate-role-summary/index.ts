// Generate a concise AI candidate-fit summary for a role listing.
// Generated ONCE per role; regenerated only when role content changes.
// Idempotency via SHA-256 content hash stored alongside the summary.
//
// Required secret: OPENAI_API_KEY (Supabase Dashboard → Edge Functions → Secrets).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a concise recruiting copywriter. Given a job listing, output valid JSON with exactly two fields:
{"candidate":"...","responsibility":"..."}
Rules:
- "candidate": One sentence (max 25 words) describing who the ideal candidate is. Focus on distinctive skills/experience.
- "responsibility": One sentence (max 25 words) summarizing the core job responsibility. Focus on what they will do day-to-day.
- Output ONLY the JSON object, nothing else.`;

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

Deno.serve(async (req) => {
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

  // Fetch role
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select(
      "id, job_title, company, division, job_description, requirements, nice_to_haves, ai_summary, content_hash"
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

  // Build content hash from the fields that matter for the summary
  const contentForHash = [
    role.job_title,
    role.company,
    role.division || "",
    stripHtml(role.job_description),
    stripHtml(role.requirements),
    stripHtml(role.nice_to_haves),
  ].join("|");
  const contentHash = await sha256Hex(contentForHash);

  // Return existing summary if content hasn't changed
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

  // Abort gracefully if OpenAI key is missing
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

  // Call OpenAI
  try {
    const userPrompt = buildUserPrompt({
      job_title: role.job_title,
      company: role.company,
      division: role.division,
      requirements: role.requirements,
      nice_to_haves: role.nice_to_haves,
      job_description: role.job_description,
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
        max_tokens: 120,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      return new Response(
        JSON.stringify({
          ai_summary: role.ai_summary || null,
          error: "Generation failed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = (data?.choices?.[0]?.message?.content ?? "").trim();

    if (!raw) {
      return new Response(
        JSON.stringify({
          ai_summary: role.ai_summary || null,
          error: "Empty response",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse JSON from response (handle markdown-wrapped JSON)
    let summaryJson: string;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      summaryJson = JSON.stringify({
        candidate: (parsed.candidate || "").trim(),
        responsibility: (parsed.responsibility || "").trim(),
      });
    } catch {
      // Fallback: store raw text as candidate only
      summaryJson = JSON.stringify({ candidate: raw, responsibility: "" });
    }

    // Persist summary + hash back to the roles row
    await supabase
      .from("roles")
      .update({ ai_summary: summaryJson, content_hash: contentHash } as any)
      .eq("id", roleId);

    return new Response(
      JSON.stringify({ ai_summary: summaryJson, generated: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("generate-role-summary error:", err);
    return new Response(
      JSON.stringify({
        ai_summary: role.ai_summary || null,
        error: err instanceof Error ? err.message : "Generation failed",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
