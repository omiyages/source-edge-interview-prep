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

// Generate cryptographically secure password
const generateSecurePassword = (length: number = 16): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure password meets complexity requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return generateSecurePassword(length);
  }
  
  return password;
};

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

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Fetching Google Sheets data for sheet:', sheetId);
    
    const accessToken = await getAccessToken(serviceAccountKey);
    
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    const response = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Permission denied: Make sure the service account has access to the Google Sheet');
      } else if (response.status === 401) {
        throw new Error('Authentication failed: Please check the service account configuration');
      } else if (response.status === 404) {
        throw new Error('Sheet not found: Please check that the Sheet ID is correct');
      } else {
        throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in the specified range');
    }

    const [headers, ...rows] = data.values;
    const candidates = [];

    // Get all hiring stages
    const { data: hiringStages } = await supabase
      .from('hiring_stages')
      .select('id, name')
      .order('stage_order', { ascending: true });

    if (!hiringStages || hiringStages.length === 0) {
      throw new Error('No hiring stages found. Please create hiring stages first.');
    }

    const firstStage = hiringStages[0];

    // Process each row and create candidate data
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const candidateData: any = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_user: false,
      };

      let appliedCompany = null;
      let appliedJobTitle = null;
      let kanbanStage = null;
      let foundName = false;

      // Map columns based on columnMappings
      headers.forEach((header: string, index: number) => {
        const mapping = columnMappings[header];
        const cellValue = row[index];
        
        if (mapping && cellValue && cellValue.trim()) {
          switch (mapping) {
            case 'email':
              candidateData.email = cellValue.trim();
              break;
            case 'full_name':
              candidateData.full_name = cellValue.trim();
              foundName = true;
              break;
            case 'linkedin_profile':
              candidateData.linkedin_profile = cellValue.trim();
              break;
            case 'current_company':
              candidateData.current_company = cellValue.trim();
              break;
            case 'phone_number':
              candidateData.phone_number = cellValue.trim();
              break;
            case 'years_of_experience':
              candidateData.years_of_experience = parseInt(cellValue) || null;
              break;
            case 'salary':
              candidateData.salary = parseInt(cellValue) || null;
              break;
            case 'skillsets':
              candidateData.skillsets = cellValue.split(',').map((s: string) => s.trim()).filter(s => s);
              break;
            case 'past_companies':
              candidateData.past_companies = cellValue.split(',').map((s: string) => s.trim()).filter(s => s);
              break;
            case 'general_notes':
              candidateData.general_notes = cellValue.trim();
              break;
            case 'applied_company':
              appliedCompany = cellValue.trim();
              break;
            case 'applied_job_title':
              appliedJobTitle = cellValue.trim();
              break;
            case 'kanban_stage':
              kanbanStage = cellValue.trim();
              break;
          }
        }
      });

      // Skip if no name found
      if (!foundName) {
        console.log(`Skipping row ${i + 2}: No name found`);
        continue;
      }

      let candidateId;
      let isNewCandidate = false;

      // Check if candidate already exists (by email if provided, otherwise by name)
      let existingCandidate = null;
      if (candidateData.email) {
        const { data } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', candidateData.email)
          .single();
        existingCandidate = data;
      }
      
      // If no match by email, try by name
      if (!existingCandidate) {
        const { data } = await supabase
          .from('candidates')
          .select('id')
          .eq('full_name', candidateData.full_name)
          .single();
        existingCandidate = data;
      }

      if (existingCandidate) {
        // Update existing candidate
        candidateId = existingCandidate.id;
        const { error: updateError } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', candidateId);

        if (updateError) {
          console.error('Error updating candidate:', updateError);
          continue;
        }
        console.log(`Updated existing candidate: ${candidateData.full_name}`);
      } else {
        // Create new candidate
        const { data: newCandidate, error: createError } = await supabase
          .from('candidates')
          .insert(candidateData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating candidate:', createError);
          continue;
        }

        candidateId = newCandidate.id;
        isNewCandidate = true;
        console.log(`Created new candidate: ${candidateData.full_name}`);
      }

      // Determine target stage
      let targetStageId = firstStage.id;
      
      if (kanbanStage) {
        const matchingStage = hiringStages.find(stage => 
          stage.name.toLowerCase() === kanbanStage.toLowerCase()
        );
        if (matchingStage) {
          targetStageId = matchingStage.id;
        }
      }

      // Check if candidate already has an active pipeline entry
      const { data: existingPipeline } = await supabase
        .from('candidate_pipeline')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('is_active', true)
        .single();

      if (existingPipeline) {
        // Update existing pipeline entry
        const { error: pipelineError } = await supabase
          .from('candidate_pipeline')
          .update({
            stage_id: targetStageId,
            applied_company: appliedCompany,
            applied_job_title: appliedJobTitle,
            moved_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPipeline.id);

        if (pipelineError) {
          console.error('Error updating pipeline:', pipelineError);
          continue;
        }
        console.log(`Updated pipeline for candidate: ${candidateData.full_name}`);
      } else {
        // Create new pipeline entry
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
        console.log(`Added candidate to pipeline: ${candidateData.full_name}`);
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
        full_name: candidateData.full_name,
        email: candidateData.email,
        is_new: isNewCandidate
      });
    }

    // Update last sync time
    await supabase
      .from('google_sheets_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    const newCandidates = candidates.filter(c => c.is_new).length;
    const updatedCandidates = candidates.filter(c => !c.is_new).length;

    return new Response(
      JSON.stringify({
        success: true,
        imported_count: candidates.length,
        new_candidates: newCandidates,
        updated_candidates: updatedCandidates,
        candidates: candidates,
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
