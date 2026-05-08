
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5'

type AdminRole = 'admin' | 'user'

const ALLOWED_ORIGINS = [
  'https://omiyages.com',
  'https://www.omiyages.com',
  'http://localhost:8080',
  'http://localhost:5173',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-clerk-jwt, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  return forwarded.split(',')[0].trim().slice(0, 64)
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY')!
const clerkJwksUrl =
  Deno.env.get('CLERK_JWKS_URL') ?? 'https://clerk.omiyages.com/.well-known/jwks.json'
const clerkIssuer = Deno.env.get('CLERK_ISSUER') ?? null

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const generateSecurePassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += charset[array[i] % charset.length]
  }

  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*]/.test(password)
  ) {
    return generateSecurePassword(length)
  }
  return password
}

const validateAndSanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') throw new Error('Invalid input provided')
  if (/<script|javascript:|on\w+=/i.test(input)) {
    throw new Error('Security violation: Invalid input detected')
  }

  const sanitized = input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, maxLength)

  if (!sanitized) throw new Error('Input cannot be empty after sanitization')
  return sanitized
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

async function clerkRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

async function verifyAdmin(req: Request): Promise<{ id: string; email: string | null } | null> {
  // NOTE: Supabase Functions' gateway validates the `Authorization` JWT itself.
  // Clerk session tokens are RS256 (asymmetric) and will be rejected at the gateway.
  // So we pass the Clerk JWT in a custom header and verify it ourselves.
  const token = req.headers.get('x-clerk-jwt')?.trim() ?? ''
  if (!token) return null

  let clerkUserId: string | null = null
  try {
    const jwks = createRemoteJWKSet(new URL(clerkJwksUrl))
    const verifyOptions = clerkIssuer ? { issuer: clerkIssuer } : undefined
    const { payload } = await jwtVerify(token, jwks, verifyOptions)
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null
    clerkUserId = payload.sub
  } catch {
    return null
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role')
    .eq('id', clerkUserId)
    .single()

  if (error || !data || data.role !== 'admin') return null
  return { id: data.id, email: data.email }
}

async function createClerkUser(email: string, fullName: string, password: string) {
  const [firstName = '', ...rest] = fullName.split(' ')
  const lastName = rest.join(' ')

  const response = await clerkRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [email],
      password,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      skip_password_checks: true,
      skip_password_requirement: true,
    }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.errors?.[0]?.message || body?.message || 'Failed to create Clerk user'
    throw new Error(message)
  }

  return body as { id: string; created_at: number; primary_email_address_id: string | null }
}

async function deleteClerkUser(clerkUserId: string): Promise<void> {
  const response = await clerkRequest(`/users/${clerkUserId}`, { method: 'DELETE' })
  // 404 can happen if user was already removed; treat as non-fatal.
  if (response.status === 404) return
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Clerk delete failed: ${response.status} ${body}`)
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

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
    const caller = await verifyAdmin(req)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const actorKey = `${caller.id}:${getClientIp(req)}`

    let requestData: Record<string, any> = {}
    try {
      requestData = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { method, body } = requestData
    if (method === 'DELETE_USER') {
      return await handleDeleteUser(body?.userId, caller.id, actorKey, corsHeaders)
    }

    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      operation_name: 'admin_user_creation',
      max_attempts: 10,
      window_minutes: 60,
      actor_key: actorKey,
    })
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userData = requestData.body || requestData
    const { email, fullName, role = 'user', customPassword } = userData

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sanitizedEmail = ''
    let sanitizedFullName = ''
    let sanitizedRole: AdminRole = 'user'
    try {
      sanitizedEmail = validateAndSanitizeInput(String(email).toLowerCase(), 254)
      sanitizedFullName = fullName ? validateAndSanitizeInput(String(fullName), 100) : ''
      const roleValue = validateAndSanitizeInput(String(role), 10).toLowerCase()
      sanitizedRole = roleValue === 'admin' ? 'admin' : 'user'
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!validateEmail(sanitizedEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let passwordToUse = generateSecurePassword(16)
    if (typeof customPassword === 'string' && customPassword.trim().length > 0) {
      if (customPassword.length < 8) {
        return new Response(JSON.stringify({ error: 'Custom password must be at least 8 characters long' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      passwordToUse = customPassword
    }

    const clerkUser = await createClerkUser(sanitizedEmail, sanitizedFullName, passwordToUse)

    try {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: clerkUser.id,
        email: sanitizedEmail,
        full_name: sanitizedFullName || null,
        role: sanitizedRole,
        created_by: caller.id,
        is_active: true,
      })

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`)
      }
    } catch (error) {
      await deleteClerkUser(clerkUser.id).catch(() => {})
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        user: {
          id: clerkUser.id,
          email: sanitizedEmail,
          full_name: sanitizedFullName,
          role: sanitizedRole,
        },
        temporaryPassword: passwordToUse,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleDeleteUser(
  userId: string,
  requestingUserId: string,
  actorKey: string,
  corsHeaders: Record<string, string>
) {
  try {
    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid user ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (userId === requestingUserId) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account for security reasons' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      operation_name: 'admin_user_deletion',
      max_attempts: 5,
      window_minutes: 30,
      actor_key: actorKey,
    })
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded for deletion operations' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await deleteClerkUser(userId).catch(() => {})

    await supabaseAdmin.from('course_assignments').delete().eq('user_id', userId)
    await supabaseAdmin.from('user_progress').delete().eq('user_id', userId)
    const { error: deleteProfileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    if (deleteProfileError) {
      return new Response(JSON.stringify({ error: `Failed to delete profile: ${deleteProfileError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to delete user: ${(error as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
