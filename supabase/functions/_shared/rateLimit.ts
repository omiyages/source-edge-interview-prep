import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

/** Rate limit keyed by actor_key via check_rate_limit RPC (rate_limit_events table). */
export async function checkActorRateLimit(
  supabase: SupabaseClient,
  actorKey: string,
  operationName: string,
  maxAttempts: number,
  windowMinutes: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    operation_name: operationName,
    max_attempts: maxAttempts,
    window_minutes: windowMinutes,
    actor_key: actorKey,
  })

  if (error) {
    console.error('rate limit rpc error:', error.message)
    return false
  }

  return data === true
}

export function serviceRoleClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
