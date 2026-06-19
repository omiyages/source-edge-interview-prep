// Server-side generation of interview preparation notes using OpenAI.
// Notes are generated ONCE per question (when content changes) and reused by all users.
// Idempotency via prompt hash; fail gracefully returning existing or empty notes.
//
// Required secret: Set OPENAI_API_KEY in Supabase Dashboard → Edge Functions → generate-prep-notes → Secrets.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifyClerkUser,
  unauthorizedResponse,
  appendCorsHeader,
  isAdminUserId,
} from "../_shared/clerkAuth.ts";
import { checkActorRateLimit } from "../_shared/rateLimit.ts";
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
const SYSTEM_PROMPT = "You generate concise interview preparation notes. Focus on what interviewers are testing, common pitfalls, and what candidates should emphasize. Return EXACTLY 3-4 notes. Each note must be UNDER 20 WORDS. Output valid JSON only: {\"preparation_notes\": [\"note1\", \"note2\", \"note3\"]}";
function buildUserPrompt(row) {
  const parts = [
    `Role: ${row.role || ""}`,
    `Category: ${row.category || ""}`,
    `Interview stage: ${row.interview_stage || ""}`,
    `Question: ${row.question || ""}`
  ];
  if (row.additional_context?.trim()) {
    parts.push(`Details: ${row.additional_context.trim().substring(0, 1500)}`);
  }
  return parts.join("\n");
}
async function sha256Hex(text) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf)).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
function parseNotesJson(raw) {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed.preparation_notes)) return [];
  return parsed.preparation_notes.filter((n)=>typeof n === "string").map((n)=>n.trim()).filter((n)=>n.length > 0).slice(0, 4);
}
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return forwarded.split(",")[0].trim().slice(0, 64);
}

Deno.serve(async (req)=>{
  const corsHeaders = appendCorsHeader(getCorsHeaders(req.headers.get("origin")));
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const auth = await verifyClerkUser(req);
  if (!auth.ok) return unauthorizedResponse(corsHeaders, auth.error);
  const userId = auth.userId;
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  let questionId;
  try {
    const body = await req.json();
    questionId = body?.question_id;
    if (!questionId || typeof questionId !== "string") {
      return new Response(JSON.stringify({
        error: "question_id required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch  {
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const { data: row, error: fetchError } = await supabase.from("interview_questions").select("id, question, company, role, interview_stage, category, additional_context, preparation_notes, preparation_notes_prompt_hash").eq("id", questionId).single();
  if (fetchError || !row) {
    return new Response(JSON.stringify({
      error: "Question not found",
      preparation_notes: []
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const userPrompt = buildUserPrompt({
    role: row.role,
    category: row.category,
    interview_stage: row.interview_stage,
    question: row.question,
    additional_context: row.additional_context
  });
  const promptHash = await sha256Hex(userPrompt);
  const existingNotes = Array.isArray(row.preparation_notes) ? row.preparation_notes : row.preparation_notes != null ? row.preparation_notes.filter((n)=>typeof n === "string") : [];
  if (row.preparation_notes_prompt_hash === promptHash && existingNotes.length > 0) {
    return new Response(JSON.stringify({
      preparation_notes: existingNotes
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const actorKey = `${userId}:${getClientIp(req)}`;
  const rateLimitOk = await checkActorRateLimit(
    supabase,
    userId,
    'ai_generate_prep_notes',
    40,
    60,
    actorKey,
  );
  if (!rateLimitOk) {
    return new Response(JSON.stringify({
      error: "Rate limit exceeded",
      preparation_notes: existingNotes,
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const canGenerate = await isAdminUserId(userId);
  if (!canGenerate) {
    return new Response(JSON.stringify({
      preparation_notes: existingNotes,
      error: "Insufficient permissions to generate notes"
    }), {
      status: 403,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  if (!openaiKey) {
    return new Response(JSON.stringify({
      preparation_notes: existingNotes.length > 0 ? existingNotes : [],
      error: "OpenAI not configured"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      const safeErrText = errText.replace(/Bearer\s+[^\s"]+/gi, "Bearer [REDACTED]");
      console.error("OpenAI error:", res.status, safeErrText);
      return new Response(JSON.stringify({
        preparation_notes: existingNotes,
        error: "Generation failed"
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const notes = parseNotesJson(content);
    const finalNotes = notes.length >= 3 ? notes : notes.length > 0 ? notes : existingNotes;
    await supabase.from("interview_questions").update({
      preparation_notes: finalNotes,
      preparation_notes_generated_at: new Date().toISOString(),
      preparation_notes_prompt_hash: promptHash
    }).eq("id", questionId);
    return new Response(JSON.stringify({
      preparation_notes: finalNotes
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("generate-prep-notes error:", err);
    return new Response(JSON.stringify({
      preparation_notes: existingNotes.length > 0 ? existingNotes : [],
      error: err instanceof Error ? err.message : "Generation failed"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
