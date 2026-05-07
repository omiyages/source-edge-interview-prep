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

import { createClient } from 'npm:@supabase/supabase-js@2'

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
  const encoder = new TextEncoder()
  const signatures = svixSignature.split(' ')
  return signatures.some((sig) => {
    const [, value] = sig.split(',')
    if (!value) return false
    const a = encoder.encode(value)
    const b = encoder.encode(expectedSig)
    if (a.length !== b.length) return false
    let mismatch = 0
    for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i]
    return mismatch === 0
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
    console.error(`Failed to set Clerk publicMetadata: ${resp.status}`)
  }
}

async function handleUserCreated(user: ClerkUser) {
  const email = getPrimaryEmail(user)
  const fullName = getFullName(user)

  // Primary key for profiles is the Clerk user ID (TEXT) after migration.
  // Use upsert to make this handler idempotent.
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        clerk_id: user.id,
        email,
        full_name: fullName,
        role: 'user',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  if (error) throw new Error(`Failed to upsert profile: ${error.message}`)

  console.log(`Upserted profile for clerk user ${user.id}`)
  return user.id
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
    .eq('id', user.id)

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  console.log(`Updated profile for user ${user.id}`)
}

async function handleUserDeleted(data: { id: string }) {
  const profileId = data.id

  // Delete dependent rows before removing the profile
  await supabaseAdmin.from('course_assignments').delete().eq('user_id', profileId)
  await supabaseAdmin.from('user_progress').delete().eq('user_id', profileId)

  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', profileId)

  if (error) {
    throw new Error(`Failed to delete profile: ${error.message}`)
  }

  console.log(`Deleted profile ${profileId} for user ${data.id}`)
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
    console.error(`Error handling ${eventType}`)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
