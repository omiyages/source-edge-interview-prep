
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  verifyClerkUser,
  unauthorizedResponse,
  appendCorsHeader,
  isAdminUserId,
} from '../_shared/clerkAuth.ts'

const ALLOWED_ORIGINS = [
  'https://omiyages.com',
  'https://www.omiyages.com',
  'http://localhost:8080',
  'http://localhost:5173',
];
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-clerk-jwt, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const corsHeaders = appendCorsHeader(getCorsHeaders(req.headers.get('origin')));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await verifyClerkUser(req)
    if (!auth.ok) {
      return unauthorizedResponse(corsHeaders, auth.error)
    }
    const userId = auth.userId

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('field_name, value')
        .order('value')

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const isAdmin = await isAdminUserId(userId)
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin privileges required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { field_name, option_value } = await req.json()

      if (!field_name || !option_value) {
        return new Response(
          JSON.stringify({ error: 'field_name and option_value are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('dropdown_options')
        .insert({
          field_name,
          value: option_value,
          created_by: userId
        })
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
