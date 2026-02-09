// ABOUTME: Supabase Edge Function for sending transactional emails via Resend
// ABOUTME: Handles welcome emails, course assignment notifications, and other email types

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Source Edge <noreply@omiyages.com>'

// Allowlisted @source-edge.com emails that should still receive emails
const SOURCE_EDGE_ALLOWLIST = [
  'namtaelee@source-edge.com',
  'james@source-edge.com',
]

// Check if an email should receive messages (skip proxy/fake @source-edge.com emails)
function shouldSendEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  if (!normalizedEmail.endsWith('@source-edge.com')) return true
  return SOURCE_EDGE_ALLOWLIST.includes(normalizedEmail)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Email Templates ────────────────────────────────────────────────────────

function welcomeEmail(fullName: string, email: string, temporaryPassword: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to Source Edge - Your Account is Ready',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;margin:0;">Welcome to Source Edge</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Your interview preparation starts here</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi <strong>${fullName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Your Source Edge account has been created. Use the credentials below to sign in and start your interview preparation journey.</p>
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 20px;">
        <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Your Login Credentials</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      <p style="color:#ef4444;font-size:13px;margin:0 0 24px;">Please change your password after your first login for security.</p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://www.omiyages.com/auth" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Sign In Now</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">If you have any questions, reach out to your admin.</p>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; 2026 Source Edge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  }
}

function courseAssignedEmail(fullName: string, courseName: string, courseDescription: string | null): { subject: string; html: string } {
  return {
    subject: `New Course Assigned: ${courseName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;margin:0;">New Course Assigned</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">You have a new course to prepare for</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi <strong>${fullName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">A new course has been assigned to you. Get started to stay ahead in your interview preparation!</p>
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 20px;">
        <p style="color:#6366f1;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin:0 0 8px;">Course</p>
        <p style="color:#111827;font-size:18px;font-weight:700;margin:0 0 8px;">${courseName}</p>
        ${courseDescription ? `<p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">${courseDescription}</p>` : ''}
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://www.omiyages.com/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Start Learning</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">Keep up the great work!</p>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; 2026 Source Edge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  }
}

const ADMIN_EMAIL = 'namtaelee@source-edge.com'

function adminNewRegistrationEmail(fullName: string, email: string): { subject: string; html: string } {
  return {
    subject: `New Registration Pending Approval: ${fullName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;margin:0;">New Registration</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">A new user is waiting for approval</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">A new user has registered on Source Edge and is pending your approval.</p>
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 20px;">
        <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Registration Details</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Name:</strong> ${fullName}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Email:</strong> ${email}</p>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://www.omiyages.com/admin" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Review in Admin Dashboard</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">Please review and approve or reject this registration.</p>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; 2026 Source Edge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse request first to check type
    const body = await req.json()
    const { type, data } = body

    // Allow unauthenticated calls for admin_new_registration (called during public signup)
    const allowUnauthenticated = type === 'admin_new_registration'

    if (!allowUnauthenticated) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!type) {
      return new Response(JSON.stringify({ error: 'Email type is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let to: string
    let subject: string
    let html: string

    switch (type) {
      case 'welcome': {
        const { email, fullName, temporaryPassword } = data
        if (!email || !fullName || !temporaryPassword) {
          return new Response(JSON.stringify({ error: 'Missing required fields: email, fullName, temporaryPassword' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        to = email
        const template = welcomeEmail(fullName, email, temporaryPassword)
        subject = template.subject
        html = template.html
        break
      }

      case 'course_assigned': {
        const { userId, courseName, courseDescription } = data
        if (!userId || !courseName) {
          return new Response(JSON.stringify({ error: 'Missing required fields: userId, courseName' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        // Look up user's email and name
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single()

        if (profileError || !profile?.email) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        to = profile.email
        const template = courseAssignedEmail(profile.full_name || 'there', courseName, courseDescription || null)
        subject = template.subject
        html = template.html
        break
      }

      case 'admin_new_registration': {
        const { fullName, email } = data
        if (!fullName || !email) {
          return new Response(JSON.stringify({ error: 'Missing required fields: fullName, email' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        to = ADMIN_EMAIL
        const template = adminNewRegistrationEmail(fullName, email)
        subject = template.subject
        html = template.html
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Skip sending to proxy @source-edge.com emails (except allowlisted ones)
    if (!shouldSendEmail(to)) {
      console.log('⏭️ Skipping email to proxy address:', to)
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Proxy email address' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const errText = await resendResponse.text()
      console.error('Resend API error:', resendResponse.status, errText)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendData = await resendResponse.json()
    console.log('✅ Email sent successfully:', { type, to, id: resendData.id })

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Email function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
