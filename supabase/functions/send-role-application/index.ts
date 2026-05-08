// Send a role application notification email to admin with CV attachment.
//
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  — Resend API key
//   ADMIN_EMAIL     — Email address to receive applications (e.g. admin@omiyages.com)
//
// Optional secret:
//   FROM_EMAIL      — Sender address (default: notifications@omiyages.com)

import { createClient } from "npm:@supabase/supabase-js@2";

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
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return forwarded.split(",")[0].trim().slice(0, 64);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  const supabaseAuthClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const actorKey = `${user.id}:${getClientIp(req)}`;
  const { data: rateLimitOk, error: rateLimitError } = await supabaseAuthClient.rpc('check_rate_limit', {
    operation_name: 'send_role_application_email',
    max_attempts: 10,
    window_minutes: 60,
    actor_key: actorKey,
  });
  if (rateLimitError || !rateLimitOk) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  const fromEmail = Deno.env.get("FROM_EMAIL") || "notifications@omiyages.com";

  if (!resendKey || !adminEmail) {
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    application_id: string;
    role_title: string;
    company: string;
    full_name: string;
    email: string;
    phone: string;
    resume_path: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { application_id, role_title, company, full_name, email, phone, resume_path } = body;

  if (!role_title || !full_name || !email) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (resume_path && !resume_path.startsWith(user.id + '/')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
  }

  // Download the CV from Supabase Storage to attach it
  let attachments: { filename: string; content: string }[] = [];

  if (resume_path) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: fileData, error: downloadError } = await supabase.storage
        .from("role-applications")
        .download(resume_path);

      if (!downloadError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        // Base64 encode for Resend attachment
        let binary = "";
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        const ext = resume_path.split(".").pop() || "pdf";
        attachments = [
          {
            filename: `${full_name.replace(/\s+/g, "_")}_CV.${ext}`,
            content: base64,
          },
        ];
      }
    } catch (err) {
      console.error("Failed to download CV for attachment:", err);
    }
  }

  // HTML escape helper to prevent XSS in email template
  const escHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')

  // Build the email
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">New Role Application</h1>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Role:</td>
            <td style="padding: 8px 0; color: #111827;">${escHtml(role_title)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Company:</td>
            <td style="padding: 8px 0; color: #111827;">${company ? escHtml(company) : "—"}</td>
          </tr>
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Applicant Name:</td>
            <td style="padding: 8px 0; color: #111827;">${escHtml(full_name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 8px 0; color: #111827;"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
            <td style="padding: 8px 0; color: #111827;">${phone ? escHtml(phone) : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">CV Attached:</td>
            <td style="padding: 8px 0; color: #111827;">${attachments.length > 0 ? "Yes ✓" : "No"}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Application ID: ${application_id ? escHtml(application_id) : "N/A"}<br/>
          Submitted at ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;

  try {
    const resendPayload: Record<string, unknown> = {
      from: `Source Edge <${fromEmail}>`,
      to: [adminEmail],
      subject: `New Application: ${escHtml(role_title)} — ${escHtml(full_name)}`,
      html: htmlBody,
    };

    if (attachments.length > 0) {
      resendPayload.attachments = attachments;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(resendPayload),
    });

    if (!res.ok) {
      console.error("Resend error status:", res.status);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-role-application error");
    return new Response(
      JSON.stringify({ error: "Send failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
