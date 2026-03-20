/**
 * Migrate Supabase Auth users → Clerk
 *
 * What it does:
 *  1. Reads every user from auth.users via direct PostgreSQL connection
 *  2. Creates a matching Clerk user, preserving their bcrypt password hash
 *     so they can sign in immediately without resetting their password
 *  3. Sets public_metadata.supabase_uuid = <existing Supabase UUID> so the
 *     JWT template includes the correct UUID and all their data stays linked
 *  4. The clerk-webhook fires on each created user and links the existing
 *     profile row instead of creating a new one
 *
 * OAuth-only users (no encrypted_password) are imported without a password.
 * They will need to use "Forgot password" or re-auth via OAuth.
 *
 * Prerequisites:
 *   npm install -D pg @types/pg tsx
 *
 * Run:
 *   SUPABASE_DB_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" \
 *   CLERK_SECRET_KEY="sk_..." \
 *   npx tsx scripts/migrate-users-to-clerk.ts
 *
 * Safe to re-run — users already in Clerk are skipped automatically.
 */

import { Client } from 'pg'

const DB_URL = process.env.SUPABASE_DB_URL
const CLERK_SECRET = process.env.CLERK_SECRET_KEY

if (!DB_URL) {
  console.error('Missing SUPABASE_DB_URL env var')
  process.exit(1)
}
if (!CLERK_SECRET) {
  console.error('Missing CLERK_SECRET_KEY env var')
  process.exit(1)
}

interface SupabaseUser {
  id: string
  email: string | null
  encrypted_password: string | null
  created_at: string
  raw_user_meta_data: Record<string, unknown> | null
}

async function listSupabaseUsers(pg: Client): Promise<SupabaseUser[]> {
  const { rows } = await pg.query<SupabaseUser>(`
    SELECT
      id,
      email,
      encrypted_password,
      created_at,
      raw_user_meta_data
    FROM auth.users
    WHERE email IS NOT NULL
    ORDER BY created_at ASC
  `)
  return rows
}

interface ClerkCreatePayload {
  email_address: string[]
  public_metadata: { supabase_uuid: string; migrated_from_supabase: true }
  password_digest?: string
  password_hasher?: string
  skip_password_checks?: boolean
  skip_password_requirement?: boolean
  first_name?: string
  last_name?: string
}

async function createClerkUser(user: SupabaseUser): Promise<{ id: string } | null> {
  const meta = user.raw_user_meta_data ?? {}

  const payload: ClerkCreatePayload = {
    email_address: [user.email!],
    public_metadata: {
      supabase_uuid: user.id,
      migrated_from_supabase: true,
    },
  }

  // Carry over display name if stored in Supabase metadata
  if (typeof meta.full_name === 'string') {
    const [first, ...rest] = meta.full_name.split(' ')
    payload.first_name = first
    if (rest.length) payload.last_name = rest.join(' ')
  }

  if (user.encrypted_password) {
    // bcrypt hash — Clerk can verify it directly, users keep their password
    payload.password_digest = user.encrypted_password
    payload.password_hasher = 'bcrypt'
  } else {
    // OAuth-only user — no password, user will need to set one or use OAuth
    payload.skip_password_checks = true
    payload.skip_password_requirement = true
  }

  const resp = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await resp.json() as { id?: string; errors?: { code: string; message: string }[] }

  if (resp.ok) {
    return { id: body.id! }
  }

  const code = body.errors?.[0]?.code ?? ''
  if (code === 'form_identifier_exists') {
    return null // already migrated
  }

  throw new Error(body.errors?.[0]?.message ?? `HTTP ${resp.status}`)
}

async function main() {
  const pg = new Client({ connectionString: DB_URL })
  await pg.connect()
  console.log('Connected to Supabase DB\n')

  let users: SupabaseUser[]
  try {
    users = await listSupabaseUsers(pg)
  } finally {
    await pg.end()
  }

  console.log(`Found ${users.length} Supabase users to migrate\n`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    try {
      const result = await createClerkUser(user)

      if (result === null) {
        console.log(`  ⏭  ${user.email} — already in Clerk`)
        skipped++
      } else {
        const hasPassword = !!user.encrypted_password
        console.log(`  ✓  ${user.email} → Clerk ${result.id} ${hasPassword ? '(password migrated)' : '(no password — OAuth user)'}`)
        migrated++
      }
    } catch (err) {
      console.error(`  ✗  ${user.email} — ${err}`)
      failed++
    }

    // Stay well under Clerk's rate limit (~20 req/s for free tier)
    await new Promise((r) => setTimeout(r, 80))
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Migrated : ${migrated}
  Skipped  : ${skipped} (already in Clerk)
  Failed   : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
