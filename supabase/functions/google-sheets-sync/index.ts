
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
    console.log('📊 Sheet ID:', sheetId, 'Range:', range);
    console.log('🗂️ Column mappings:', JSON.stringify(columnMappings, null, 2));

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

    // Get the first hiring stage for pipeline entries
    console.log('🔍 Getting first hiring stage...');
    const { data: stages, error: stagesError } = await supabase
      .from('hiring_stages')
      .select('id')
      .order('order_index')
      .limit(1);
    
    if (stagesError || !stages || stages.length === 0) {
      throw new Error('No hiring stages found. Please create hiring stages first.');
    }
    
    const firstStageId = stages[0].id;
    console.log('📌 Using first stage ID:', firstStageId);

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Update total count with actual data
    const progress = progressState.get(integrationId)!;
    progress.total = dataRows.length;
    progress.status = 'processing';
    progressState.set(integrationId, progress);

    console.log(`📊 Processing ${dataRows.length} rows with headers:`, headers);
    console.log('🔍 Available column mappings:', Object.keys(columnMappings || {}));

    const BATCH_SIZE = 5;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    // Process in batches with better progress tracking
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(dataRows.length / BATCH_SIZE);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (rows ${i + 2} to ${Math.min(i + BATCH_SIZE + 1, dataRows.length + 1)})`);

      try {
        for (const row of batch) {
          try {
            console.log(`🔍 Processing row with ${row.length} columns:`, row.slice(0, 3), '...');
            
            // Map row data using column mappings with better fallbacks
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

            // Apply column mappings with detailed debugging
            console.log('🗂️ Applying column mappings...');
            let foundName = false;
            
            Object.entries(columnMappings || {}).forEach(([header, fieldName]) => {
              const columnIndex = headers.findIndex(h => h === header);
              console.log(`📋 Mapping header "${header}" (index: ${columnIndex}) to field "${fieldName}"`);
              
              if (columnIndex >= 0 && columnIndex < row.length && row[columnIndex]) {
                const value = row[columnIndex].toString().trim();
                
                if (value) {
                  console.log(`✅ Found value "${value}" for field "${fieldName}"`);
                  
                  switch (fieldName) {
                    case 'full_name':
                      candidateData[fieldName] = value;
                      foundName = true;
                      console.log(`👤 Found name: ${value}`);
                      break;
                    case 'skillsets':
                    case 'past_companies':
                      // Handle array fields by splitting on common delimiters
                      candidateData[fieldName] = value.split(/[,;|\n]/).map(item => item.trim()).filter(item => item);
                      break;
                    case 'years_of_experience':
                      // Extract numeric value from experience strings
                      const numMatch = value.match(/(\d+)/);
                      candidateData[fieldName] = numMatch ? parseInt(numMatch[1]) : null;
                      break;
                    case 'salary':
                      // Extract numeric value from salary strings
                      const salaryMatch = value.replace(/[$,]/g, '').match(/(\d+)/);
                      candidateData[fieldName] = salaryMatch ? parseInt(salaryMatch[1]) : null;
                      break;
                    case 'email':
                      // Validate email format
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      candidateData[fieldName] = emailRegex.test(value) ? value : `${value.replace(/[^a-zA-Z0-9]/g, '')}@noemail.local`;
                      break;
                    default:
                      candidateData[fieldName] = value;
                  }
                } else {
                  console.log(`⚠️ Empty value for header "${header}" at column ${columnIndex}`);
                }
              } else {
                console.log(`❌ Header "${header}" not found in sheet headers or column is empty`);
              }
            });

            console.log('📋 Final candidate data:', {
              full_name: candidateData.full_name,
              email: candidateData.email,
              foundName: foundName
            });

            // Skip rows without essential data
            if (!candidateData.full_name) {
              console.log('⚠️ Skipping row without name - no name found after mapping');
              console.log('🔍 Available headers:', headers);
              console.log('🔍 Column mappings:', columnMappings);
              console.log('🔍 Row data:', row);
              continue;
            }

            console.log(`🔄 Processing candidate: ${candidateData.full_name}`);

            // Check if candidate exists by name first
            const { data: existingCandidates, error: searchError } = await supabase
              .from('candidates')
              .select('id, full_name, email')
              .eq('full_name', candidateData.full_name);

            if (searchError) {
              console.error('❌ Error searching for candidate:', searchError);
              continue;
            }

            let candidateId;
            let wasCreated = false;

            if (existingCandidates && existingCandidates.length > 0) {
              // Update existing candidate
              candidateId = existingCandidates[0].id;
              console.log(`👤 Found existing candidate by name: ${candidateData.full_name}`);
              
              const { error: updateError } = await supabase
                .from('candidates')
                .update(candidateData)
                .eq('id', candidateId);

              if (updateError) {
                console.error('❌ Error updating candidate:', updateError);
                continue;
              }
              
              console.log(`✅ Updated existing candidate: ${candidateData.full_name}`);
              totalUpdated++;
            } else {
              // Create new candidate
              console.log(`➕ Creating new candidate: ${candidateData.full_name}`);
              
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
              console.log(`✅ Created new candidate: ${candidateData.full_name}`);
            }

            // CRITICAL: Ensure pipeline entry exists for ALL candidates (both new and updated)
            console.log(`🔄 Processing pipeline for candidate ${candidateData.full_name} (ID: ${candidateId})`);
            
            // Check for existing pipeline entries
            const { data: existingPipeline, error: pipelineSearchError } = await supabase
              .from('candidate_pipeline')
              .select('id, stage_id, applied_company, applied_job_title, is_active')
              .eq('candidate_id', candidateId);

            if (pipelineSearchError) {
              console.error('❌ Error searching pipeline:', pipelineSearchError);
              const currentProgress = progressState.get(integrationId)!;
              currentProgress.errors.push(`Pipeline search failed for ${candidateData.full_name}: ${pipelineSearchError.message}`);
              progressState.set(integrationId, currentProgress);
              continue;
            }

            console.log(`📋 Found ${existingPipeline?.length || 0} existing pipeline entries for ${candidateData.full_name}`);

            if (existingPipeline && existingPipeline.length > 0) {
              // Update existing pipeline entry to ensure it's active
              const pipelineEntry = existingPipeline[0];
              console.log(`✅ Found existing pipeline entry for ${candidateData.full_name}`);
              
              const { error: pipelineUpdateError } = await supabase
                .from('candidate_pipeline')
                .update({
                  is_active: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', pipelineEntry.id);

              if (pipelineUpdateError) {
                console.error('❌ Error updating pipeline entry:', pipelineUpdateError);
                const currentProgress = progressState.get(integrationId)!;
                currentProgress.errors.push(`Failed to update pipeline for ${candidateData.full_name}: ${pipelineUpdateError.message}`);
                progressState.set(integrationId, currentProgress);
              } else {
                console.log(`✅ Updated pipeline entry for ${candidateData.full_name}`);
              }
            } else {
              // Create new pipeline entry - this is crucial for Kanban visibility
              console.log(`➕ Creating new pipeline entry for ${candidateData.full_name}`);
              
              const { error: pipelineInsertError } = await supabase
                .from('candidate_pipeline')
                .insert({
                  candidate_id: candidateId,
                  stage_id: firstStageId,
                  is_active: true,
                  applied_company: candidateData.current_company || null,
                  applied_job_title: null,
                  notes: `Synced from Google Sheets on ${new Date().toISOString()}`
                });

              if (pipelineInsertError) {
                console.error('❌ Error creating pipeline entry:', pipelineInsertError);
                const currentProgress = progressState.get(integrationId)!;
                currentProgress.errors.push(`Failed to create pipeline for ${candidateData.full_name}: ${pipelineInsertError.message}`);
                progressState.set(integrationId, currentProgress);
              } else {
                console.log(`✅ Created new pipeline entry for ${candidateData.full_name}`);
              }
            }

            totalProcessed++;
            
            // Update progress more frequently for better UI feedback
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

        console.log(`✅ Batch completed: ${totalProcessed}/${dataRows.length} processed (${totalCreated} created, ${totalUpdated} updated, ${progressState.get(integrationId)?.errors.length || 0} errors)`);
        
        // Small delay between batches to prevent overwhelming the database
        if (i + BATCH_SIZE < dataRows.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} failed:`, batchError);
        const currentProgress = progressState.get(integrationId)!;
        currentProgress.errors.push(`Batch ${batchNumber} failed: ${batchError.message}`);
        progressState.set(integrationId, currentProgress);
      }
    }

    // Mark as completed
    const finalProgress = progressState.get(integrationId)!;
    finalProgress.status = 'completed';
    finalProgress.processed = totalProcessed;
    finalProgress.created = totalCreated;
    finalProgress.updated = totalUpdated;
    progressState.set(integrationId, finalProgress);

    console.log(`🎉 Sync completed! Processed: ${totalProcessed}, Created: ${totalCreated}, Updated: ${totalUpdated}, Errors: ${finalProgress.errors.length}`);

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
