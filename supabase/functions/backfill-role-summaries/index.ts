// Cron-safe backfill for roles missing ai_summary.
// Invoke on a schedule with header: x-cron-secret: <CRON_SECRET>

import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH_SIZE = 10;

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ["https://omiyages.com", "https://www.omiyages.com"].includes(origin)
    ? origin
    : "https://omiyages.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const got = req.headers.get("x-cron-secret");
  if (got !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: roles, error } = await supabase
    .from("roles")
    .select("id, job_title, company")
    .eq("status", "active")
    .is("ai_summary", null)
    .order("created_at", { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const role of roles ?? []) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-role-summary`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role_id: role.id }),
      });
      const payload = await res.json().catch(() => ({}));
      const ok = res.ok && !!payload?.ai_summary;
      results.push({
        id: role.id,
        ok,
        error: ok ? undefined : String(payload?.error ?? `HTTP ${res.status}`),
      });
    } catch (err) {
      results.push({
        id: role.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      succeeded: results.filter((r) => r.ok).length,
      results,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
