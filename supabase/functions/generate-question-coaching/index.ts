// Server-side generation of Interviewer's Intent and STAR Winning Answer Framework.
// Generated ONCE per question; regenerate only when question, role, category, or stage changes.
// Idempotency via prompt hash; fail gracefully returning existing or empty.
//
// Required secret: OPENAI_API_KEY (Supabase Dashboard → Edge Functions → generate-question-coaching → Secrets).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT =
  'You are an expert engineering interview coach. Generate concise, high-signal interview guidance. Output valid JSON only. Rules: interviewer_intent = array of 3 bullets max, each under 20 words. winning_answer_framework: situation and task = 1 sentence max each (context-setting); action = array of bullet points (leadership, decision-making, tradeoffs); result = 1 sentence max (measurable impact preferred). Avoid generic phrasing.';

function buildUserPrompt(row: {
  role: string;
  category: string | null;
  interview_stage: string | null;
  question: string;
}): string {
  return [
    `Role: ${row.role || ""}`,
    `Category: ${row.category || ""}`,
    `Interview stage: ${row.interview_stage || ""}`,
    `Question: ${row.question || ""}`,
  ].join("\n");
}

async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface WinningAnswerFramework {
  situation: string;
  task: string;
  action: string[];
  result: string;
}

interface CoachingOutput {
  interviewer_intent: string[];
  winning_answer_framework: WinningAnswerFramework;
}

function parseCoachingJson(raw: string): CoachingOutput | null {
  try {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
    const parsed = JSON.parse(jsonStr) as {
      interviewer_intent?: unknown;
      winning_answer_framework?: unknown;
    };
    const intent = Array.isArray(parsed.interviewer_intent)
      ? parsed.interviewer_intent.filter((x): x is string => typeof x === "string").map((s) => s.trim()).slice(0, 3)
      : [];
    const waf = parsed.winning_answer_framework;
    if (!waf || typeof waf !== "object") return null;
    const framework = waf as Record<string, unknown>;
    const situation = typeof framework.situation === "string" ? framework.situation.trim() : "";
    const task = typeof framework.task === "string" ? framework.task.trim() : "";
    const result = typeof framework.result === "string" ? framework.result.trim() : "";
    const action = Array.isArray(framework.action)
      ? framework.action.filter((x): x is string => typeof x === "string").map((s) => s.trim())
      : [];
    return {
      interviewer_intent: intent,
      winning_answer_framework: { situation, task, action, result },
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

  let questionId: string;
  try {
    const body = await req.json();
    questionId = body?.question_id;
    if (!questionId || typeof questionId !== "string") {
      return new Response(
        JSON.stringify({ error: "question_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: row, error: fetchError } = await supabase
    .from("interview_questions")
    .select("id, question, role, interview_stage, category, interviewer_intent, winning_answer_framework, coaching_prompt_hash")
    .eq("id", questionId)
    .single();

  if (fetchError || !row) {
    return new Response(
      JSON.stringify({
        error: "Question not found",
        interviewer_intent: [],
        winning_answer_framework: null,
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userPrompt = buildUserPrompt({
    role: row.role,
    category: row.category,
    interview_stage: row.interview_stage,
    question: row.question,
  });
  const promptHash = await sha256Hex(userPrompt);

  const existingIntent = Array.isArray(row.interviewer_intent) ? row.interviewer_intent : [];
  const existingFramework =
    row.winning_answer_framework && typeof row.winning_answer_framework === "object"
      ? (row.winning_answer_framework as WinningAnswerFramework)
      : null;

  if (row.coaching_prompt_hash === promptHash && existingIntent.length > 0 && existingFramework) {
    return new Response(
      JSON.stringify({
        interviewer_intent: existingIntent,
        winning_answer_framework: existingFramework,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        interviewer_intent: existingIntent,
        winning_answer_framework: existingFramework,
        error: "OpenAI not configured",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      return new Response(
        JSON.stringify({
          interviewer_intent: existingIntent,
          winning_answer_framework: existingFramework,
          error: "Generation failed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseCoachingJson(content);

    if (!parsed) {
      return new Response(
        JSON.stringify({
          interviewer_intent: existingIntent,
          winning_answer_framework: existingFramework,
          error: "Invalid response",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("interview_questions")
      .update({
        interviewer_intent: parsed.interviewer_intent,
        winning_answer_framework: parsed.winning_answer_framework,
        coaching_generated_at: new Date().toISOString(),
        coaching_prompt_hash: promptHash,
      })
      .eq("id", questionId);

    return new Response(
      JSON.stringify({
        interviewer_intent: parsed.interviewer_intent,
        winning_answer_framework: parsed.winning_answer_framework,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-question-coaching error:", err);
    return new Response(
      JSON.stringify({
        interviewer_intent: existingIntent,
        winning_answer_framework: existingFramework,
        error: err instanceof Error ? err.message : "Generation failed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
