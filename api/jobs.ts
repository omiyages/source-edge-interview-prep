import { createClient } from "@supabase/supabase-js";

type JobResponse = {
  id: string;
  title: string;
  company: string;
  description: string;
  status: "open" | "on-hold" | "closed";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function toPlainText(htmlOrText: unknown): string {
  if (typeof htmlOrText !== "string") return "";
  return htmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("roles")
    .select("id, job_title, company, job_description")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }

  const payload: JobResponse[] = (data ?? []).map((row: any) => ({
    id: String(row.id ?? ""),
    title: String(row.job_title ?? ""),
    company: typeof row.company === "string" ? row.company : "",
    description: toPlainText(row.job_description),
    status: "open",
  }));

  return res.status(200).json(payload);
}
