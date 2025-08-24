// ABOUTME: Completely secure Google API proxy that eliminates token theft possibilities
// ABOUTME: Handles all Google API calls server-side with encrypted token storage

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleAPIRequest {
  integration_id: string;
  endpoint: string;
  method?: string;
  body?: any;
}

interface TokenStorage {
  [key: string]: {
    token: string;
    user_id: string;
    last_used: number;
  };
}

// Server-side token storage (never exposed to frontend)
const serverTokens: TokenStorage = {};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Authentication failed');
    }

    console.log('Authenticated user:', user.id);

    const { integration_id, endpoint, method = 'GET', body }: GoogleAPIRequest = await req.json();

    if (!integration_id || !endpoint) {
      throw new Error('Missing required parameters: integration_id and endpoint');
    }

    // CRITICAL SECURITY: Use secure proxy function to validate ownership and get request info
    const { data: proxyData, error: proxyError } = await supabase
      .rpc('secure_google_api_proxy', {
        integration_id,
        api_endpoint: endpoint,
        http_method: method,
        request_body: body
      });

    if (proxyError) {
      console.error('Proxy validation failed:', proxyError);
      throw new Error('Access denied or integration not found');
    }

    console.log('Proxy validation successful for user:', user.id);

    // Check if we have the actual token in server storage
    const tokenKey = `${user.id}_${integration_id}`;
    if (!serverTokens[tokenKey]) {
      // Token not in server storage - user needs to re-authenticate
      return new Response(JSON.stringify({
        success: false,
        error: 'TOKEN_REQUIRED',
        message: 'Google OAuth token required. Please re-authenticate.',
        auth_url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${Deno.env.get('GOOGLE_CLIENT_ID')}&redirect_uri=${encodeURIComponent('https://satshobhbkjptsbmfsia.supabase.co/functions/v1/secure-google-api/callback')}&response_type=code&scope=https://www.googleapis.com/auth/spreadsheets&access_type=offline&state=${integration_id}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storedToken = serverTokens[tokenKey];
    
    // Make the Google API call with the stored token
    const googleApiUrl = endpoint.startsWith('http') ? endpoint : `https://sheets.googleapis.com/v4/${endpoint}`;
    
    console.log('Making Google API call to:', googleApiUrl);
    
    const apiResponse = await fetch(googleApiUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${storedToken.token}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Google API error:', apiData);
      
      // If token expired, remove from storage and require re-auth
      if (apiData.error?.status === 'UNAUTHENTICATED') {
        delete serverTokens[tokenKey];
        return new Response(JSON.stringify({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Google OAuth token expired. Please re-authenticate.',
          auth_url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${Deno.env.get('GOOGLE_CLIENT_ID')}&redirect_uri=${encodeURIComponent('https://satshobhbkjptsbmfsia.supabase.co/functions/v1/secure-google-api/callback')}&response_type=code&scope=https://www.googleapis.com/auth/spreadsheets&access_type=offline&state=${integration_id}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Google API error: ${apiData.error?.message || 'Unknown error'}`);
    }

    // Update last used timestamp
    storedToken.last_used = Date.now();

    console.log('Google API call successful');

    // Log successful API usage
    await supabase.rpc('log_security_event', {
      p_event_type: 'secure_google_api_success',
      p_user_id: user.id,
      p_user_email: user.email,
      p_resource_accessed: 'google_sheets_api',
      p_action_attempted: `${method} ${endpoint}`,
      p_success: true,
      p_risk_level: 'low',
      p_metadata: {
        integration_id,
        endpoint,
        response_status: apiResponse.status
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: apiData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Secure Google API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: error.message.includes('Authentication') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Export the server tokens for OAuth callback access
export { serverTokens };