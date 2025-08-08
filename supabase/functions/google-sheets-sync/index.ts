
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
  lastUpdate: number;
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

// Helper function to update progress
function updateProgress(integrationId: string, updates: Partial<typeof progressState.prototype>) {
  const current = progressState.get(integrationId);
  if (current) {
    const updated = { ...current, ...updates, lastUpdate: Date.now() };
    progressState.set(integrationId, updated);
    console.log(`📊 Progress update for ${integrationId}:`, {
      processed: updated.processed,
      total: updated.total,
      created: updated.created,
      updated: updated.updated,
      status: updated.status
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse request body
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

  const { integrationId, sheetId, range, columnMappings, action } = requestBody;

  try {
    const supabase = createClient(
      'https://satshobhbkjptsbmfsia.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

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
    console.log('📋 Sync parameters:', { sheetId, range, mappingsCount: Object.keys(columnMappings || {}).length });

    // Initialize progress
    progressState.set(integrationId, {
      total: 0,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      status: 'starting',
      startTime: Date.now(),
      lastUpdate: Date.now()
    });

    // Get service account key
    const serviceAccountKeyString = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyString) {
      throw new Error('Google service account key not configured');
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyString);
    const accessToken = await getAccessToken(serviceAccountKey);

    // Fetch Google Sheets data
    const fullRange = range || 'A:Z';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(fullRange)}`;
    
    console.log('📡 Fetching from Google Sheets URL:', sheetsUrl);
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('❌ Google Sheets API error:', sheetsResponse.status, errorText);
      
      let errorMessage = `Google Sheets API error (${sheetsResponse.status})`;
      if (sheetsResponse.status === 403) {
        errorMessage = 'Permission denied: Make sure the service account has access to the Google Sheet';
      } else if (sheetsResponse.status === 401) {
        errorMessage = 'Authentication failed: Please check the service account configuration';
      } else if (sheetsResponse.status === 404) {
        errorMessage = 'Sheet not found: Please check that the Sheet ID is correct';
      }
      
      throw new Error(errorMessage);
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];
    
    console.log(`📊 Retrieved ${rows.length} rows from Google Sheets`);
    
    if (rows.length === 0) {
      console.log('📊 No data found in the sheet');
      updateProgress(integrationId, { status: 'completed' });
      
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

    // Get hiring stages
    const { data: stages, error: stagesError } = await supabase
      .from('hiring_stages')
      .select('id, name')
      .order('order_index');
    
    if (stagesError) {
      console.error('❌ Error fetching stages:', stagesError);
      throw new Error(`Failed to fetch hiring stages: ${stagesError.message}`);
    }

    if (!stages || stages.length === 0) {
      throw new Error('No hiring stages found. Please create hiring stages first.');
    }

    console.log('📂 Available stages:', stages.map(s => ({ id: s.id, name: s.name })));

    // Create comprehensive stage mapping
    const stageMap = new Map<string, string>();
    stages.forEach(stage => {
      const name = stage.name.toLowerCase().trim();
      stageMap.set(name, stage.id);
      // Add variations
      stageMap.set(name.replace(/\s+/g, ''), stage.id);
      stageMap.set(name.replace(/\s+/g, '_'), stage.id);
      stageMap.set(name.replace(/\s+/g, '-'), stage.id);
      stageMap.set(name.replace(/[^a-z0-9]/g, ''), stage.id);
    });
    
    const firstStageId = stages[0].id;
    console.log('🎯 Default stage ID:', firstStageId);

    const headers = rows[0] || [];
    const dataRows = rows.slice(1);
    
    console.log('📋 Headers found:', headers);
    console.log('📋 Column mappings:', columnMappings);
    
    // Update progress with total count
    updateProgress(integrationId, {
      total: dataRows.length,
      status: 'processing'
    });

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const BATCH_SIZE = 10; // Reduced batch size for better error tracking

    // Process in smaller batches
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (rows ${i + 1}-${Math.min(i + BATCH_SIZE, dataRows.length)})`);
      
      for (const [rowIndex, row] of batch.entries()) {
        const actualRowIndex = i + rowIndex + 2; // +2 because we skip header and array is 0-indexed
        
        try {
          console.log(`🔄 Processing row ${actualRowIndex}:`, row.slice(0, 3)); // Log first 3 columns for debugging
          
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

          // Apply column mappings with detailed logging
          let mappedFields = 0;
          Object.entries(columnMappings || {}).forEach(([header, fieldName]) => {
            const columnIndex = headers.findIndex(h => h === header);
            
            if (columnIndex >= 0 && columnIndex < row.length && row[columnIndex]) {
              const value = row[columnIndex].toString().trim();
              
              if (value) {
                mappedFields++;
                console.log(`📝 Mapping ${header} -> ${fieldName}: "${value}"`);
                
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
                    if (fieldName in candidateData) {
                      candidateData[fieldName] = value;
                    }
                }
              }
            } else {
              console.log(`⚠️ Column "${header}" not found or empty (index: ${columnIndex}, rowLength: ${row.length})`);
            }
          });

          console.log(`📊 Mapped ${mappedFields} fields for row ${actualRowIndex}`);
          console.log(`👤 Candidate data:`, { 
            name: candidateData.full_name, 
            email: candidateData.email,
            company: candidateData.current_company || appliedCompany,
            stage: kanbanStage
          });

          // Skip rows without essential data
          if (!candidateData.full_name || candidateData.full_name.length < 2) {
            console.log(`⚠️ Skipping row ${actualRowIndex}: No valid name found`);
            totalSkipped++;
            continue;
          }

          let candidateId;
          let wasCreated = false;

          // Check if candidate exists
          const { data: existingCandidates, error: searchError } = await supabase
            .from('candidates')
            .select('id, full_name, email')
            .eq('full_name', candidateData.full_name);

          if (searchError) {
            console.error(`❌ Error searching for candidate in row ${actualRowIndex}:`, searchError);
            updateProgress(integrationId, { 
              errors: [...(progressState.get(integrationId)?.errors || []), `Row ${actualRowIndex}: Search error - ${searchError.message}`]
            });
            continue;
          }

          if (existingCandidates && existingCandidates.length > 0) {
            // Update existing candidate
            candidateId = existingCandidates[0].id;
            console.log(`🔄 Updating existing candidate: ${candidateData.full_name} (ID: ${candidateId})`);
            
            const { error: updateError } = await supabase
              .from('candidates')
              .update(candidateData)
              .eq('id', candidateId);

            if (updateError) {
              console.error(`❌ Error updating candidate in row ${actualRowIndex}:`, updateError);
              updateProgress(integrationId, { 
                errors: [...(progressState.get(integrationId)?.errors || []), `Row ${actualRowIndex}: Update error - ${updateError.message}`]
              });
              continue;
            }
            
            totalUpdated++;
            console.log(`✅ Updated candidate: ${candidateData.full_name}`);
          } else {
            // Create new candidate
            console.log(`➕ Creating new candidate: ${candidateData.full_name}`);
            
            const { data: newCandidate, error: insertError } = await supabase
              .from('candidates')
              .insert(candidateData)
              .select('id')
              .single();

            if (insertError) {
              console.error(`❌ Error creating candidate in row ${actualRowIndex}:`, insertError);
              updateProgress(integrationId, { 
                errors: [...(progressState.get(integrationId)?.errors || []), `Row ${actualRowIndex}: Create error - ${insertError.message}`]
              });
              continue;
            }

            candidateId = newCandidate.id;
            wasCreated = true;
            totalCreated++;
            console.log(`✅ Created candidate: ${candidateData.full_name} (ID: ${candidateId})`);
          }

          // Handle pipeline entry
          let stageId = firstStageId;
          if (kanbanStage) {
            const normalizedStage = kanbanStage.toLowerCase().trim();
            const mappedStageId = stageMap.get(normalizedStage) || 
                                stageMap.get(normalizedStage.replace(/\s+/g, '')) ||
                                stageMap.get(normalizedStage.replace(/\s+/g, '_')) ||
                                stageMap.get(normalizedStage.replace(/[^a-z0-9]/g, ''));
            
            if (mappedStageId) {
              stageId = mappedStageId;
              console.log(`🎯 Mapped stage "${kanbanStage}" to ID: ${stageId}`);
            } else {
              console.log(`⚠️ Stage "${kanbanStage}" not found, using default stage: ${firstStageId}`);
            }
          }

          // Check for existing pipeline entry
          const { data: existingPipeline, error: pipelineSearchError } = await supabase
            .from('candidate_pipeline')
            .select('id, stage_id, applied_company, applied_job_title, is_active')
            .eq('candidate_id', candidateId);

          if (pipelineSearchError) {
            console.error(`❌ Error searching pipeline for row ${actualRowIndex}:`, pipelineSearchError);
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

            if (appliedCompany !== null) pipelineUpdateData.applied_company = appliedCompany;
            if (appliedJobTitle !== null) pipelineUpdateData.applied_job_title = appliedJobTitle;

            console.log(`🔄 Updating pipeline for candidate: ${candidateData.full_name}`);
            
            const { error: pipelineUpdateError } = await supabase
              .from('candidate_pipeline')
              .update(pipelineUpdateData)
              .eq('id', pipelineEntry.id);

            if (pipelineUpdateError) {
              console.error(`❌ Error updating pipeline entry for row ${actualRowIndex}:`, pipelineUpdateError);
            } else {
              console.log(`✅ Updated pipeline for: ${candidateData.full_name}`);
            }
          } else {
            // Create new pipeline entry
            console.log(`➕ Creating pipeline entry for candidate: ${candidateData.full_name}`);
            
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
              console.error(`❌ Error creating pipeline entry for row ${actualRowIndex}:`, pipelineInsertError);
            } else {
              console.log(`✅ Created pipeline entry for: ${candidateData.full_name}`);
            }
          }

          totalProcessed++;
          
          // Update progress frequently
          updateProgress(integrationId, {
            processed: totalProcessed,
            created: totalCreated,
            updated: totalUpdated
          });

        } catch (rowError) {
          console.error(`❌ Error processing row ${actualRowIndex}:`, rowError);
          updateProgress(integrationId, { 
            errors: [...(progressState.get(integrationId)?.errors || []), `Row ${actualRowIndex}: ${rowError.message}`]
          });
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < dataRows.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Mark as completed
    updateProgress(integrationId, {
      status: 'completed',
      processed: totalProcessed,
      created: totalCreated,
      updated: totalUpdated
    });

    console.log(`🎉 Sync completed! Total: ${dataRows.length}, Processed: ${totalProcessed}, Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);

    return new Response(JSON.stringify({
      success: true,
      totalRows: dataRows.length,
      processed: totalProcessed,
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: progressState.get(integrationId)?.errors || [],
      message: `Successfully synced ${totalProcessed} candidates (${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Sync failed:', error);
    
    // Update progress state on error
    if (integrationId && progressState.has(integrationId)) {
      updateProgress(integrationId, {
        status: 'error',
        errors: [...(progressState.get(integrationId)?.errors || []), error.message]
      });
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
