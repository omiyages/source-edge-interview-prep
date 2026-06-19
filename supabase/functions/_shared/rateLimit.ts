import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

/** Rate limit keyed by Clerk user id; works with service-role clients (no auth.uid()). */
export async function checkActorRateLimit(
  supabase: SupabaseClient,
  userId: string,
  operationName: string,
  maxAttempts: number,
  windowMinutes: number,
  actorKey?: string,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const { count, error: countError } = await supabase
    .from('security_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', operationName)
    .gte('created_at', windowStart)

  if (countError) {
    console.error('rate limit count error:', countError.message)
    return false
  }

  if ((count ?? 0) >= maxAttempts) {
    await supabase.from('security_audit_log').insert({
      user_id: userId,
      action: 'rate_limit_exceeded',
      details: { operation: operationName, attempts: count, actor_key: actorKey ?? null },
    })
    return false
  }

  const { error: insertError } = await supabase.from('security_audit_log').insert({
    user_id: userId,
    action: operationName,
    details: { timestamp: new Date().toISOString(), actor_key: actorKey ?? null },
  })

  if (insertError) {
    console.error('rate limit log error:', insertError.message)
    return false
  }

  return true
}

export function serviceRoleClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
