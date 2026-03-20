/**
 * Clerk Webhook Handler
 *
 * Receives Clerk webhook events and syncs user data to the profiles table.
 * Handles: user.created, user.updated, user.deleted
 *
 * Setup:
 *   1. In the Clerk dashboard → Webhooks, create an endpoint pointing to:
 *      https://<project-ref>.supabase.co/functions/v1/clerk-webhook
 *   2. Set the signing secret as the env var CLERK_WEBHOOK_SECRET in Supabase:
 *      supabase secrets set CLERK_WEBHOOK_SECRET=whsec_...
 *   3. Subscribe to events: user.created, user.updated, user.deleted
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------- Webhook Signature Verification ----------

async function verifyWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Reject timestamps older than 5 minutes to prevent replay attacks
  const now = Math.floor(Date.now() / 1000)
  const ts = parseInt(svixTimestamp, 10)
  if (isNaN(ts) || Math.abs(now - ts) > 300) return false

  // Build the signed content
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`

  // The secret is base64-encoded after the "whsec_" prefix
  const secretBytes = Uint8Array.from(
    atob(webhookSecret.replace(/^whsec_/, '')),
    (c) => c.charCodeAt(0)
  )

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  )

  const expectedSig = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  )

  // svix-signature may contain multiple space-separated signatures (v1,xxx v1,yyy)
  const signatures = svixSignature.split(' ')
  return signatures.some((sig) => {
    const [, value] = sig.split(',')
    return value === expectedSig
  })
}

// ---------- Event Handlers ----------

interface ClerkUser {
  id: string // e.g. "user_2abc..."
  email_addresses: { email_address: string; id: string }[]
  primary_email_address_id: string
  first_name: string | null
  last_name: string | null
  public_metadata: Record<string, unknown>
  image_url: string | null
}

function getPrimaryEmail(user: ClerkUser): string {
  const primary = user.email_addresses.find(
    (e) => e.id === user.primary_email_address_id
  )
  return primary?.email_address ?? user.email_addresses[0]?.email_address ?? ''
}

function getFullName(user: ClerkUser): string | null {
  const parts = [user.first_name, user.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

async function setClerkPublicMetadata(clerkUserId: string, supabaseUuid: string) {
  const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY')
  if (!clerkSecretKey) return
  const resp = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/metadata`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ public_metadata: { supabase_uuid: supabaseUuid } }),
  })
  if (!resp.ok) {
    console.error(`Failed to set Clerk publicMetadata: ${resp.status} ${await resp.text()}`)
  }
}

async function handleUserCreated(user: ClerkUser) {
  // Idempotency — already linked
  const { data: existingByClerkId } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('clerk_id', user.id)
    .maybeSingle()

  if (existingByClerkId) {
    console.log(`Profile already exists for clerk_id=${user.id}`)
    return existingByClerkId.id
  }

  // Migration case — supabase_uuid was pre-set during bulk import
  const presetUuid = user.public_metadata?.supabase_uuid as string | undefined
  if (presetUuid) {
    const { data: existingByUuid } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', presetUuid)
      .maybeSingle()

    if (existingByUuid) {
      await supabaseAdmin
        .from('profiles')
        .update({ clerk_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', presetUuid)
      console.log(`Linked migrated profile ${presetUuid} to clerk_id=${user.id}`)
      return presetUuid
    }
  }

  // New user — generate a fresh UUID
  const supabaseUuid = presetUuid ?? crypto.randomUUID()
  const email = getPrimaryEmail(user)

  const { error } = await supabaseAdmin.from('profiles').insert({
    id: supabaseUuid,
    clerk_id: user.id,
    email,
    full_name: getFullName(user),
    role: 'user',
  })

  if (error) {
    // Email already exists from old Supabase Auth — link by email
    if (error.code === '23505') {
      const { data: existingByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingByEmail) {
        await supabaseAdmin
          .from('profiles')
          .update({ clerk_id: user.id, updated_at: new Date().toISOString() })
          .eq('id', existingByEmail.id)

        console.log(`Linked existing profile ${existingByEmail.id} to clerk_id=${user.id}`)
        // publicMetadata may not have supabase_uuid yet — backfill it
        await setClerkPublicMetadata(user.id, existingByEmail.id)
        return existingByEmail.id
      }
    }
    throw new Error(`Failed to create profile: ${error.message}`)
  }

  console.log(`Created profile ${supabaseUuid} for clerk_id=${user.id}`)
  await setClerkPublicMetadata(user.id, supabaseUuid)
  return supabaseUuid
}

async function handleUserUpdated(user: ClerkUser) {
  const email = getPrimaryEmail(user)
  const fullName = getFullName(user)

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', user.id)

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  console.log(`Updated profile for clerk_id=${user.id}`)
}

async function handleUserDeleted(data: { id: string }) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: false })
    .eq('clerk_id', data.id)

  if (error) {
    throw new Error(`Failed to deactivate profile: ${error.message}`)
  }

  console.log(`Deactivated profile for clerk_id=${data.id}`)
}

// ---------- Main Handler ----------

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.text()

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(payload, req.headers)
  if (!isValid) {
    console.error('Invalid webhook signature')
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(payload)
  const eventType: string = event.type

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(event.data as ClerkUser)
        break
      case 'user.updated':
        await handleUserUpdated(event.data as ClerkUser)
        break
      case 'user.deleted':
        await handleUserDeleted(event.data as { id: string })
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(`Error handling ${eventType}:`, err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
