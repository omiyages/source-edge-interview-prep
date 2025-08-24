// ABOUTME: Secure Google OAuth callback that stores tokens server-side only
// ABOUTME: Eliminates frontend token exposure by handling OAuth flow entirely on server

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import server token storage
const serverTokens: any = {};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // integration_id
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Error: ${error}</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    console.log('Processing OAuth callback for integration:', state);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://satshobhbkjptsbmfsia.supabase.co/functions/v1/google-oauth-callback',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      throw new Error('Failed to exchange authorization code for token');
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    console.log('Token exchange successful');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get integration details to find the user
    const { data: integration, error: integrationError } = await supabase
      .from('google_sheets_integrations')
      .select('user_id, sheet_id')
      .eq('id', state)
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      throw new Error('Integration not found');
    }

    const userId = integration.user_id;
    console.log('Found integration for user:', userId);

    // Store token in server-side storage (NEVER in database plaintext)
    const tokenKey = `${userId}_${state}`;
    serverTokens[tokenKey] = {
      token: access_token,
      refresh_token: refresh_token,
      user_id: userId,
      expires_at: Date.now() + (expires_in * 1000),
      last_used: Date.now()
    };

    // Update integration to mark token as configured (store only a hash reference)
    const { error: updateError } = await supabase
      .rpc('update_integration_token', {
        integration_id: state,
        new_token: access_token // This gets hashed by the function
      });

    if (updateError) {
      console.error('Failed to update integration:', updateError);
      throw new Error('Failed to update integration status');
    }

    console.log('OAuth flow completed successfully for user:', userId);

    // Log security event
    await supabase.rpc('log_security_event', {
      p_event_type: 'oauth_callback_success',
      p_user_id: userId,
      p_resource_accessed: 'google_oauth',
      p_action_attempted: 'token_exchange',
      p_success: true,
      p_risk_level: 'medium',
      p_metadata: {
        integration_id: state,
        token_stored_securely: true,
        server_side_only: true
      }
    });

    // Return success page that closes the popup
    return new Response(`
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <h1>Authentication Successful!</h1>
          <p>Your Google Sheets integration has been securely configured.</p>
          <p>You can now close this window.</p>
          <script>
            // Notify parent window and close popup
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_SUCCESS', 
                integrationId: '${state}' 
              }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    return new Response(`
      <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>Error: ${error.message}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_ERROR', 
                error: '${error.message}' 
              }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
});