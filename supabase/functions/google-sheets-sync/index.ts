
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Global progress tracking with more detailed state
const progressState = new Map<string, {
  total: number;
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error';
  startTime: number;
}>();

// JWT helper functions for service account authentication
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToDer(pem: string): Uint8Array {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '');
  
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

  const privateKeyDer = pemToDer(serviceAccountKey.private_key);

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

  // Parse request body only once
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request body'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      'https://satshobhbkjptsbmfsia.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { integrationId, sheetId, range, columnMappings, action } = requestBody;

    // Handle progress check requests
    if (action === 'check_progress') {
      const progress = progressState.get(integrationId);
      if (!progress) {
        return new Response(JSON.stringify({
          success: true,
          progress: {
            total: 0,
            processed: 0,
            created: 0,
            updated: 0,
            errors: [],
            status: 'idle'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        progress: {
          total: progress.total,
          processed: progress.processed,
          current: progress.processed,
          created: progress.created,
          updated: progress.updated,
          errors: progress.errors,
          errorMessages: progress.errors,
          status: progress.status
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🚀 Starting Google Sheets sync for integration:', integrationId);

    // Initialize progress with better state management
    progressState.set(integrationId, {
      total: 0,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      status: 'starting',
      startTime: Date.now()
    });

    // Get service account key for authentication
    const serviceAccountKeyString = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyString) {
      throw new Error('Google service account key not configured');
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyString);
    
    // Get access token using service account
    const accessToken = await getAccessToken(serviceAccountKey);

    // Construct the range with sheet name if provided
    const fullRange = range || 'A:Z';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(fullRange)}`;
    
    console.log('📡 Fetching from Google Sheets...');
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('❌ Google Sheets API error:', sheetsResponse.status, errorText);
      
      if (sheetsResponse.status === 403) {
        throw new Error('Permission denied: Make sure the service account has access to the Google Sheet');
      } else if (sheetsResponse.status === 401) {
        throw new Error('Authentication failed: Please check the service account configuration');
      } else if (sheetsResponse.status === 404) {
        throw new Error('Sheet not found: Please check that the Sheet ID is correct');
      } else {
        throw new Error(`Google Sheets API error (${sheetsResponse.status}): ${errorText}`);
      }
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];
    
    if (rows.length === 0) {
      console.log('📊 No data found in the sheet');
      progressState.set(integrationId, {
        ...progressState.get(integrationId)!,
        status: 'completed'
      });
      
      return new Response(JSON.stringify({
        success: true,
        totalRows: 0,
        processed: 0,
        created: 0,
        updated: 0,
        message: 'No data found in the sheet'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the hiring stages for stage mapping
    const { data: stages, error: stagesError } = await supabase
      .from('hiring_stages')
      .select('id, name')
      .order('order_index');
    
    if (stagesError || !stages || stages.length === 0) {
      throw new Error('No hiring stages found. Please create hiring stages first.');
    }

    // Create stage mapping for better matching
    const stageMap = new Map<string, string>();
    stages.forEach(stage => {
      const name = stage.name.toLowerCase();
      stageMap.set(name, stage.id);
      // Add common variations
      stageMap.set(name.replace(/\s+/g, ''), stage.id);
      stageMap.set(name.replace(/\s+/g, '_'), stage.id);
      stageMap.set(name.replace(/\s+/g, '-'), stage.id);
    });
    
    const firstStageId = stages[0].id;

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Update total count with actual data
    const progress = progressState.get(integrationId)!;
    progress.total = dataRows.length;
    progress.status = 'processing';
    progressState.set(integrationId, progress);

    console.log(`📊 Processing ${dataRows.length} rows with ${Object.keys(columnMappings || {}).length} column mappings`);

    const BATCH_SIZE = 20;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    // Process in batches with better progress tracking
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, i + BATCH_SIZE);
      
      for (const row of batch) {
        try {
          // Map row data using column mappings
          const candidateData: any = {
            full_name: null,
            email: null,
            phone_number: null,
            linkedin_profile: null,
            current_company: null,
            years_of_experience: null,
            salary: null,
            skillsets: [],
            past_companies: [],
            general_notes: null,
            is_active: true
          };

          // Store pipeline-specific data separately
          let appliedCompany = null;
          let appliedJobTitle = null;
          let kanbanStage = null;

          // Apply column mappings
          Object.entries(columnMappings || {}).forEach(([header, fieldName]) => {
            const columnIndex = headers.findIndex(h => h === header);
            
            if (columnIndex >= 0 && columnIndex < row.length && row[columnIndex]) {
              const value = row[columnIndex].toString().trim();
              
              if (value) {
                switch (fieldName) {
                  case 'full_name':
                    candidateData[fieldName] = value;
                    break;
                  case 'skillsets':
                  case 'past_companies':
                    candidateData[fieldName] = value.split(/[,;|\n]/).map(item => item.trim()).filter(item => item);
                    break;
                  case 'years_of_experience':
                    const numMatch = value.match(/(\d+)/);
                    candidateData[fieldName] = numMatch ? parseInt(numMatch[1]) : null;
                    break;
                  case 'salary':
                    const salaryMatch = value.replace(/[$,]/g, '').match(/(\d+)/);
                    candidateData[fieldName] = salaryMatch ? parseInt(salaryMatch[1]) : null;
                    break;
                  case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    candidateData[fieldName] = emailRegex.test(value) ? value : `${value.replace(/[^a-zA-Z0-9]/g, '')}@noemail.local`;
                    break;
                  case 'applied_company':
                    appliedCompany = value;
                    break;
                  case 'applied_job_title':
                    appliedJobTitle = value;
                    break;
                  case 'kanban_stage':
                  case 'stage':
                    kanbanStage = value;
                    break;
                  case 'is_active':
                    const lowerValue = value.toLowerCase().trim();
                    candidateData[fieldName] = lowerValue === 'yes' || lowerValue === 'active' || lowerValue === 'true' || lowerValue === '1';
                    break;
                  default:
                    // Only set if it's a valid candidate field
                    if (fieldName in candidateData) {
                      candidateData[fieldName] = value;
                    }
                }
              }
            }
          });

          // Skip rows without essential data
          if (!candidateData.full_name) {
            console.log(`⚠️ Skipping row without name: ${JSON.stringify(row.slice(0, 3))}`);
            continue;
          }

          let candidateId;
          let wasCreated = false;

          // Check if candidate exists by name first
          const { data: existingCandidates, error: searchError } = await supabase
            .from('candidates')
            .select('id, full_name, email')
            .eq('full_name', candidateData.full_name);

          if (searchError) {
            console.error('❌ Error searching for candidate:', searchError);
            continue;
          }

          if (existingCandidates && existingCandidates.length > 0) {
            // Update existing candidate
            candidateId = existingCandidates[0].id;
            
            const { error: updateError } = await supabase
              .from('candidates')
              .update(candidateData)
              .eq('id', candidateId);

            if (updateError) {
              console.error('❌ Error updating candidate:', updateError);
              continue;
            }
            
            totalUpdated++;
          } else {
            // Create new candidate
            const { data: newCandidate, error: insertError } = await supabase
              .from('candidates')
              .insert(candidateData)
              .select('id')
              .single();

            if (insertError) {
              console.error('❌ Error creating candidate:', insertError);
              continue;
            }

            candidateId = newCandidate.id;
            wasCreated = true;
            totalCreated++;
          }

          // Determine the stage ID for pipeline
          let stageId = firstStageId; // Default to first stage
          if (kanbanStage) {
            const normalizedStage = kanbanStage.toLowerCase().trim();
            const mappedStageId = stageMap.get(normalizedStage) || 
                                stageMap.get(normalizedStage.replace(/\s+/g, '')) ||
                                stageMap.get(normalizedStage.replace(/\s+/g, '_'));
            if (mappedStageId) {
              stageId = mappedStageId;
            } else {
              console.log(`⚠️ Stage "${kanbanStage}" not found, using default stage`);
            }
          }

          // Handle pipeline entry
          const { data: existingPipeline, error: pipelineSearchError } = await supabase
            .from('candidate_pipeline')
            .select('id, stage_id, applied_company, applied_job_title, is_active')
            .eq('candidate_id', candidateId);

          if (pipelineSearchError) {
            console.error('❌ Error searching pipeline:', pipelineSearchError);
            continue;
          }

          if (existingPipeline && existingPipeline.length > 0) {
            // Update existing pipeline entry
            const pipelineEntry = existingPipeline[0];
            
            const pipelineUpdateData: any = {
              is_active: true,
              stage_id: stageId,
              updated_at: new Date().toISOString()
            };

            // Only update applied_company and applied_job_title if we have new values
            if (appliedCompany !== null) pipelineUpdateData.applied_company = appliedCompany;
            if (appliedJobTitle !== null) pipelineUpdateData.applied_job_title = appliedJobTitle;

            const { error: pipelineUpdateError } = await supabase
              .from('candidate_pipeline')
              .update(pipelineUpdateData)
              .eq('id', pipelineEntry.id);

            if (pipelineUpdateError) {
              console.error('❌ Error updating pipeline entry:', pipelineUpdateError);
            }
          } else {
            // Create new pipeline entry
            const { error: pipelineInsertError } = await supabase
              .from('candidate_pipeline')
              .insert({
                candidate_id: candidateId,
                stage_id: stageId,
                is_active: true,
                applied_company: appliedCompany || candidateData.current_company,
                applied_job_title: appliedJobTitle,
                notes: `Synced from Google Sheets on ${new Date().toISOString()}`
              });

            if (pipelineInsertError) {
              console.error('❌ Error creating pipeline entry:', pipelineInsertError);
            }
          }

          totalProcessed++;
          
          // Update progress more frequently
          const currentProgress = progressState.get(integrationId)!;
          currentProgress.processed = totalProcessed;
          currentProgress.created = totalCreated;
          currentProgress.updated = totalUpdated;
          progressState.set(integrationId, currentProgress);

        } catch (rowError) {
          console.error('❌ Error processing row:', rowError);
          const currentProgress = progressState.get(integrationId)!;
          currentProgress.errors.push(`Row processing error: ${rowError.message}`);
          progressState.set(integrationId, currentProgress);
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < dataRows.length) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }

    // Mark as completed
    const finalProgress = progressState.get(integrationId)!;
    finalProgress.status = 'completed';
    finalProgress.processed = totalProcessed;
    finalProgress.created = totalCreated;
    finalProgress.updated = totalUpdated;
    progressState.set(integrationId, finalProgress);

    console.log(`🎉 Sync completed! Processed: ${totalProcessed}, Created: ${totalCreated}, Updated: ${totalUpdated}`);

    return new Response(JSON.stringify({
      success: true,
      totalRows: dataRows.length,
      processed: totalProcessed,
      created: totalCreated,
      updated: totalUpdated,
      errors: finalProgress.errors,
      message: `Successfully synced ${totalProcessed} candidates (${totalCreated} created, ${totalUpdated} updated)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Sync failed:', error);
    
    // Update progress state on error
    const integrationId = requestBody?.integrationId;
    if (integrationId && progressState.has(integrationId)) {
      const progress = progressState.get(integrationId)!;
      progress.status = 'error';
      progress.errors.push(error.message);
      progressState.set(integrationId, progress);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
