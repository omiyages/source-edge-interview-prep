import { createClient } from 'npm:@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5'

const clerkJwksUrl =
  Deno.env.get('CLERK_JWKS_URL') ?? 'https://clerk.omiyages.com/.well-known/jwks.json'
const clerkIssuer = Deno.env.get('CLERK_ISSUER') ?? null

export type ClerkAuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string }

/** Read Clerk session JWT from x-clerk-jwt (preferred) or Authorization. */
export function getClerkJwtFromRequest(req: Request): string {
  return (
    req.headers.get('x-clerk-jwt')?.trim() ??
    req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() ??
    ''
  )
}

export async function verifyClerkUser(req: Request): Promise<ClerkAuthResult> {
  const token = getClerkJwtFromRequest(req)
  if (!token) return { ok: false, error: 'Missing auth token' }

  try {
    const jwks = createRemoteJWKSet(new URL(clerkJwksUrl))
    const verifyOptions = clerkIssuer ? { issuer: clerkIssuer } : undefined
    const { payload } = await jwtVerify(token, jwks, verifyOptions)
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return { ok: false, error: 'Invalid token' }
    }
    return { ok: true, userId: payload.sub }
  } catch {
    return { ok: false, error: 'Invalid token' }
  }
}

export async function isAdminUserId(userId: string): Promise<boolean> {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return data?.role === 'admin'
}

export function unauthorizedResponse(
  corsHeaders: Record<string, string>,
  message = 'Unauthorized',
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function appendCorsHeader(
  corsHeaders: Record<string, string>,
): Record<string, string> {
  return {
    ...corsHeaders,
    'Access-Control-Allow-Headers':
      'authorization, x-clerk-jwt, x-client-info, apikey, content-type',
  }
}
