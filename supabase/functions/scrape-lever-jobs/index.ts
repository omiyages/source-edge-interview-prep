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

type LeverPosting = {
  id: string;
  text: string;
  categories?: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  hostedUrl?: string;
  descriptionPlain?: string;
  workplaceType?: string;
  createdAt?: number;
  lists?: { text: string; content: string }[];
};

function jsonResponse(
  body: unknown,
  init: { status?: number; corsHeaders: Record<string, string> },
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...init.corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidSlug(slug: unknown): slug is string {
  if (typeof slug !== "string") return false;
  const s = slug.trim();
  if (!s) return false;
  // Lever account slugs are typically alnum + hyphen; be conservative.
  return /^[a-z0-9-]+$/i.test(s);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405, corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, { status: 400, corsHeaders });
  }

  const slug = body?.slug;
  if (!isValidSlug(slug)) {
    return jsonResponse({ success: false, error: "slug required" }, { status: 400, corsHeaders });
  }

  const apiBase =
    body?.region === "eu" ? "https://api.eu.lever.co/v0/postings" : "https://api.lever.co/v0/postings";
  const url = `${apiBase}/${slug}?mode=json`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return jsonResponse(
        { success: false, error: `Lever API returned ${res.status}: ${res.statusText}` },
        { status: 502, corsHeaders },
      );
    }
    const postings = (await res.json()) as LeverPosting[];
    return jsonResponse({ success: true, postings }, { corsHeaders });
  } catch (e) {
    return jsonResponse(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502, corsHeaders },
    );
  }
});

