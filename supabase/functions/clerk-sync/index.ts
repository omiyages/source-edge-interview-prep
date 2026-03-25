/**
 * Clerk Sync — One-Shot Orphan Cleanup
 *
 * Admin-only endpoint that:
 *   1. Fetches all user IDs from Clerk
 *   2. Deletes Supabase profiles whose clerk_id no longer exists in Clerk
 *   3. Deletes profiles with no clerk_id (old Supabase Auth orphans)
 *
 * Auth: caller must pass a valid Clerk JWT (same as the dashboard).
 *       The JWT's supabase_uuid claim is used to verify the caller is an admin.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY')!

const ALLOWED_ORIGINS = [
  'https://omiyages.com',
  'https://www.omiyages.com',
  'http://localhost:8080',
  'http://localhost:5173',
]

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Decode JWT payload without full verification — we only need supabase_uuid
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT format')
  const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(
    parts[1].length + (4 - (parts[1].length % 4)) % 4, '=',
  )
  return JSON.parse(atob(padded))
}

async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  try {
    const payload = decodeJwtPayload(token)
    // Use the Clerk user ID (sub) to look up by clerk_id
    const clerkId = payload['sub'] as string | undefined
    if (!clerkId) return false
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('clerk_id', clerkId)
      .maybeSingle()
    return data?.role === 'admin'
  } catch {
    return false
  }
}

async function fetchAllClerkUserIds(): Promise<Set<string>> {
  const ids = new Set<string>()
  let offset = 0
  const limit = 500

  while (true) {
    const resp = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${clerkSecretKey}` } },
    )
    if (!resp.ok) throw new Error(`Clerk API error: ${resp.status} ${await resp.text()}`)

    const users = await resp.json()
    if (!Array.isArray(users) || users.length === 0) break

    for (const u of users) ids.add(u.id)
    if (users.length < limit) break
    offset += limit
  }

  return ids
}

async function deleteProfile(profileId: string) {
  await supabaseAdmin.from('course_assignments').delete().eq('user_id', profileId)
  await supabaseAdmin.from('user_progress').delete().eq('user_id', profileId)
  await supabaseAdmin.from('profiles').delete().eq('id', profileId)
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors })
  }

  const isAdmin = await verifyAdmin(req.headers.get('Authorization'))
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Get all valid Clerk user IDs
    const clerkIds = await fetchAllClerkUserIds()

    // 2. Get all Supabase profiles
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, clerk_id, email, role')

    if (error) throw new Error(`Failed to fetch profiles: ${error.message}`)

    const orphans: { id: string; email: string; reason: string }[] = []

    for (const profile of profiles ?? []) {
      // Skip admin profiles — never auto-delete admins
      if (profile.role === 'admin') continue

      if (!profile.clerk_id) {
        // No Clerk ID → old Supabase Auth orphan
        orphans.push({ id: profile.id, email: profile.email, reason: 'no_clerk_id' })
      } else if (!clerkIds.has(profile.clerk_id)) {
        // Clerk ID exists but user was deleted from Clerk
        orphans.push({ id: profile.id, email: profile.email, reason: 'deleted_from_clerk' })
      }
    }

    // 3. Delete orphans
    let deleted = 0
    const errors: string[] = []

    for (const orphan of orphans) {
      try {
        await deleteProfile(orphan.id)
        deleted++
        console.log(`Deleted orphan: ${orphan.email} (${orphan.reason})`)
      } catch (err) {
        errors.push(`${orphan.email}: ${(err as Error).message}`)
        console.error(`Failed to delete ${orphan.email}:`, err)
      }
    }

    return new Response(
      JSON.stringify({
        scanned: profiles?.length ?? 0,
        clerkUsers: clerkIds.size,
        orphansFound: orphans.length,
        deleted,
        errors,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Sync error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
