
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JWT helper functions for service account authentication
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToDer(pem: string): Uint8Array {
  // Remove the header, footer, and newlines
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '');
  
  // Convert base64 to binary
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function createJWT(serviceAccountKey: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Convert PEM to DER format
  const privateKeyDer = pemToDer(serviceAccountKey.private_key);

  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  return `${unsignedToken}.${encodedSignature}`;
}

async function getAccessToken(serviceAccountKey: any): Promise<string> {
  const jwt = await createJWT(serviceAccountKey);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integrationId, sheetId, range, columnMappings } = await req.json();
    
    const serviceAccountKeyString = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyString) {
      throw new Error('Google service account key not configured');
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyString);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Set the user context
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Fetching Google Sheets data for sheet:', sheetId);
    
    // Get access token using service account
    const accessToken = await getAccessToken(serviceAccountKey);
    
    // Fetch data from Google Sheets
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    const response = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', response.status, errorText);
      
      // Provide more specific error messages
      if (response.status === 403) {
        throw new Error('Permission denied: Make sure the service account has access to the Google Sheet. Share the sheet with the service account email: ' + serviceAccountKey.client_email);
      } else if (response.status === 401) {
        throw new Error('Authentication failed: Please check the service account configuration.');
      } else if (response.status === 404) {
        throw new Error('Sheet not found: Please check that the Sheet ID is correct and the sheet exists.');
      } else if (response.status === 400) {
        throw new Error('Invalid request: Please check the range specification (e.g., "A:Z" or "Sheet1!A1:Z100").');
      } else {
        throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Google Sheets response:', data);

    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in the specified range. Please check that your sheet contains data in the specified range.');
    }

    const [headers, ...rows] = data.values;
    const candidates = [];

    // Get all hiring stages for kanban stage mapping
    const { data: hiringStages } = await supabase
      .from('hiring_stages')
      .select('id, name')
      .order('stage_order', { ascending: true });

    if (!hiringStages || hiringStages.length === 0) {
      throw new Error('No hiring stages found. Please create hiring stages first.');
    }

    // Get the first hiring stage as default
    const firstStage = hiringStages[0];

    // Process each row and create candidate data
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const candidateData: any = {
        id: crypto.randomUUID(),
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      let appliedCompany = null;
      let appliedJobTitle = null;
      let kanbanStage = null;
      let hasEmail = false;

      // Map columns based on columnMappings
      headers.forEach((header: string, index: number) => {
        const mapping = columnMappings[header];
        if (mapping && row[index]) {
          switch (mapping) {
            case 'email':
              candidateData.email = row[index];
              hasEmail = true;
              break;
            case 'full_name':
              candidateData.full_name = row[index];
              break;
            case 'linkedin_profile':
              candidateData.linkedin_profile = row[index];
              break;
            case 'current_company':
              candidateData.current_company = row[index];
              break;
            case 'phone_number':
              candidateData.phone_number = row[index];
              break;
            case 'years_of_experience':
              candidateData.years_of_experience = parseInt(row[index]) || null;
              break;
            case 'salary':
              candidateData.salary = parseInt(row[index]) || null;
              break;
            case 'skillsets':
              candidateData.skillsets = row[index].split(',').map((s: string) => s.trim());
              break;
            case 'past_companies':
              candidateData.past_companies = row[index].split(',').map((s: string) => s.trim());
              break;
            case 'general_notes':
              candidateData.general_notes = row[index];
              break;
            case 'applied_company':
              appliedCompany = row[index];
              break;
            case 'applied_job_title':
              appliedJobTitle = row[index];
              break;
            case 'kanban_stage':
              kanbanStage = row[index];
              break;
          }
        }
      });

      // Skip if no name provided
      if (!candidateData.full_name) {
        console.log(`Skipping row ${i + 2}: No name found`);
        continue;
      }

      let candidateId;

      if (hasEmail) {
        // Check if candidate already exists by email
        const { data: existingCandidate } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', candidateData.email)
          .eq('role', 'user')
          .single();

        if (existingCandidate) {
          // Update existing candidate
          candidateId = existingCandidate.id;
          const { error: updateError } = await supabase
            .from('profiles')
            .update(candidateData)
            .eq('id', candidateId);

          if (updateError) {
            console.error('Error updating candidate:', updateError);
            continue;
          }
        } else {
          // Create new candidate with email
          const { data: newCandidate, error: insertError } = await supabase
            .from('profiles')
            .insert(candidateData)
            .select('id')
            .single();

          if (insertError) {
            console.error('Error inserting candidate:', insertError);
            continue;
          }
          candidateId = newCandidate.id;
        }
      } else {
        // Create candidate without email - just add to pipeline directly
        // We'll create a temporary email for the profile
        candidateData.email = `temp_${crypto.randomUUID()}@pipeline.temp`;
        
        const { data: newCandidate, error: insertError } = await supabase
          .from('profiles')
          .insert(candidateData)
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting candidate without email:', insertError);
          continue;
        }
        candidateId = newCandidate.id;
      }

      // Determine which stage to assign the candidate to
      let targetStageId = firstStage.id;
      
      if (kanbanStage) {
        // Try to find the matching stage by name
        const matchingStage = hiringStages.find(stage => 
          stage.name.toLowerCase() === kanbanStage.toLowerCase()
        );
        if (matchingStage) {
          targetStageId = matchingStage.id;
          console.log(`Assigning candidate to stage: ${matchingStage.name}`);
        } else {
          console.log(`Stage "${kanbanStage}" not found, using default stage: ${firstStage.name}`);
        }
      }

      // Add to pipeline
      const { error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidateId,
          stage_id: targetStageId,
          applied_company: appliedCompany,
          applied_job_title: appliedJobTitle,
          moved_by: user.id,
          is_active: true,
        });

      if (pipelineError) {
        console.error('Error adding to pipeline:', pipelineError);
        continue;
      }

      // Track the import
      await supabase
        .from('google_sheets_candidate_imports')
        .upsert({
          integration_id: integrationId,
          candidate_id: candidateId,
          sheet_row_number: i + 2,
          import_data: Object.fromEntries(
            headers.map((header: string, index: number) => [header, row[index]])
          ),
        });

      candidates.push({
        id: candidateId,
        email: hasEmail ? candidateData.email : null,
        full_name: candidateData.full_name,
        applied_company: appliedCompany,
        applied_job_title: appliedJobTitle,
        kanban_stage: kanbanStage,
        assigned_stage: hiringStages.find(s => s.id === targetStageId)?.name,
        row: i + 2,
        has_email: hasEmail
      });
    }

    // Update last sync time
    await supabase
      .from('google_sheets_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    return new Response(
      JSON.stringify({
        success: true,
        imported_count: candidates.length,
        candidates: candidates,
        candidates_without_email: candidates.filter(c => !c.has_email).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-sheets-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
