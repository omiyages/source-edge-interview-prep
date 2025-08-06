
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CandidateData {
  full_name: string;
  email?: string;
  phone_number?: string;
  linkedin_profile?: string;
  current_company?: string;
  years_of_experience?: number;
  salary?: number;
  skillsets?: string[];
  past_companies?: string[];
  general_notes?: string;
  stage?: string;
  is_active?: boolean;
  applied_company?: string;
  applied_job_title?: string;
}

interface SyncProgress {
  processed: number;
  total: number;
  created: number;
  updated: number;
  errors: number;
  status: 'processing' | 'completed' | 'error';
  errorMessages: string[];
}

// Store progress in memory for this function instance
const progressStore = new Map<string, SyncProgress>();

// Background sync processor with improved error handling and progress tracking
async function processSync(
  integrationId: string,
  supabaseClient: any,
  sheetData: any,
  columnMappings: Record<string, string>
) {
  console.log('🚀 Starting background sync processing');
  
  try {
    const { values: rows } = sheetData;
    if (!rows || rows.length < 2) {
      throw new Error('No data found in the sheet');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const totalRows = dataRows.length;

    console.log(`📊 Processing ${totalRows} rows with ${headers.length} columns`);

    // Initialize progress with correct values
    const progress: SyncProgress = {
      processed: 0,
      total: totalRows,
      created: 0,
      updated: 0,
      errors: 0,
      status: 'processing',
      errorMessages: []
    };
    progressStore.set(integrationId, progress);

    // Pre-load hiring stages for better performance
    const { data: stages } = await supabaseClient
      .from('hiring_stages')
      .select('id, name')
      .order('order_index');

    const stageMap = new Map(stages?.map(s => [s.name.toLowerCase(), s.id]) || []);
    const fuzzyStageMap = new Map();
    
    stages?.forEach(stage => {
      const name = stage.name.toLowerCase();
      fuzzyStageMap.set(name, stage.id);
      fuzzyStageMap.set(name.replace(/\s+/g, ''), stage.id);
      fuzzyStageMap.set(name.replace(/\s+/g, '_'), stage.id);
      fuzzyStageMap.set(name.replace(/\s+/g, '-'), stage.id);
      
      // Add common variations
      if (name.includes('interview')) {
        const num = name.match(/\d+/)?.[0];
        if (num) {
          fuzzyStageMap.set(`interview${num}`, stage.id);
          fuzzyStageMap.set(`int${num}`, stage.id);
        }
      }
      if (name.includes('technical')) {
        fuzzyStageMap.set('tech', stage.id);
        fuzzyStageMap.set('technical', stage.id);
      }
      if (name.includes('hr')) {
        fuzzyStageMap.set('hr', stage.id);
        fuzzyStageMap.set('hr screen', stage.id);
        fuzzyStageMap.set('hrscreen', stage.id);
      }
    });
    
    const defaultStageId = stages?.[0]?.id;

    console.log('🎯 Stage mapping setup:', {
      totalStages: stages?.length || 0,
      fuzzyMappings: fuzzyStageMap.size,
      defaultStageId
    });

    // Process rows sequentially to avoid overwhelming the database
    // but with smaller batches for better progress updates
    const batchSize = 10;
    const maxProcessingTime = 5 * 60 * 1000; // 5 minutes max processing time
    const startTime = Date.now();

    for (let i = 0; i < dataRows.length; i += batchSize) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > maxProcessingTime) {
        console.log('⏰ Approaching timeout, stopping processing');
        progress.status = 'error';
        progress.errorMessages.push('Processing stopped due to timeout. Please try with smaller datasets.');
        progressStore.set(integrationId, progress);
        break;
      }

      const batch = dataRows.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(totalRows/batchSize)} (rows ${i + 2} to ${Math.min(i + batchSize + 1, totalRows + 1)})`);

      // Process each row in the batch
      for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
        const row = batch[batchIndex];
        const actualRowNumber = i + batchIndex + 2;
        
        try {
          const candidateData: CandidateData = { full_name: '', is_active: true };
          
          // Map data from row - improved data extraction
          headers.forEach((header: string, index: number) => {
            const value = row[index]?.toString()?.trim();
            if (!value || value === '' || value === 'undefined' || value === 'null') return;

            const mapping = columnMappings[header];
            if (!mapping) return;

            switch (mapping) {
              case 'full_name':
                candidateData.full_name = value;
                break;
              case 'email':
                if (value.includes('@')) {
                  candidateData.email = value.toLowerCase();
                }
                break;
              case 'phone_number':
                candidateData.phone_number = value;
                break;
              case 'linkedin_profile':
                candidateData.linkedin_profile = value;
                break;
              case 'current_company':
                candidateData.current_company = value;
                break;
              case 'applied_company':
                candidateData.applied_company = value;
                break;
              case 'applied_job_title':
                candidateData.applied_job_title = value;
                break;
              case 'years_of_experience':
                const exp = parseInt(value.toString().replace(/[^0-9]/g, ''));
                if (!isNaN(exp) && exp >= 0) candidateData.years_of_experience = exp;
                break;
              case 'salary':
                const sal = parseInt(value.toString().replace(/[,$\s]/g, ''));
                if (!isNaN(sal) && sal > 0) candidateData.salary = sal;
                break;
              case 'skillsets':
                candidateData.skillsets = value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
                break;
              case 'past_companies':
                candidateData.past_companies = value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
                break;
              case 'general_notes':
                candidateData.general_notes = value;
                break;
              case 'kanban_stage':
              case 'stage':
                candidateData.stage = value;
                break;
              case 'is_active':
                const lowerValue = value.toLowerCase().trim();
                candidateData.is_active = ['yes', 'active', 'true', '1', 'y'].includes(lowerValue);
                break;
            }
          });

          // Skip rows without names
          if (!candidateData.full_name || candidateData.full_name.length < 2) {
            progress.errors++;
            progress.errorMessages.push(`Row ${actualRowNumber}: Missing or invalid candidate name - skipped`);
            progress.processed++;
            continue;
          }

          // Check for existing candidate by name and email (better deduplication)
          let existingCandidateQuery = supabaseClient
            .from('candidates')
            .select('id')
            .eq('full_name', candidateData.full_name);
            
          if (candidateData.email) {
            existingCandidateQuery = existingCandidateQuery.or(`email.eq.${candidateData.email}`);
          }
          
          const { data: existingCandidate } = await existingCandidateQuery.maybeSingle();

          let candidateId: string;
          
          if (existingCandidate) {
            // Update existing candidate
            const updateData: any = {
              updated_at: new Date().toISOString()
            };
            
            // Only update fields that have values
            if (candidateData.email) updateData.email = candidateData.email;
            if (candidateData.phone_number) updateData.phone_number = candidateData.phone_number;
            if (candidateData.linkedin_profile) updateData.linkedin_profile = candidateData.linkedin_profile;
            if (candidateData.current_company) updateData.current_company = candidateData.current_company;
            if (candidateData.years_of_experience !== undefined) updateData.years_of_experience = candidateData.years_of_experience;
            if (candidateData.salary !== undefined) updateData.salary = candidateData.salary;
            if (candidateData.skillsets && candidateData.skillsets.length > 0) updateData.skillsets = candidateData.skillsets;
            if (candidateData.past_companies && candidateData.past_companies.length > 0) updateData.past_companies = candidateData.past_companies;
            if (candidateData.general_notes) updateData.general_notes = candidateData.general_notes;
            if (candidateData.is_active !== undefined) updateData.is_active = candidateData.is_active;

            const { error: updateError } = await supabaseClient
              .from('candidates')
              .update(updateData)
              .eq('id', existingCandidate.id);

            if (!updateError) {
              candidateId = existingCandidate.id;
              progress.updated++;
            } else {
              progress.errors++;
              progress.errorMessages.push(`Row ${actualRowNumber}: Update failed - ${updateError.message}`);
              progress.processed++;
              continue;
            }
          } else {
            // Create new candidate
            const insertData: any = {
              full_name: candidateData.full_name,
              is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Only include fields that have values
            if (candidateData.email) insertData.email = candidateData.email;
            if (candidateData.phone_number) insertData.phone_number = candidateData.phone_number;
            if (candidateData.linkedin_profile) insertData.linkedin_profile = candidateData.linkedin_profile;
            if (candidateData.current_company) insertData.current_company = candidateData.current_company;
            if (candidateData.years_of_experience !== undefined) insertData.years_of_experience = candidateData.years_of_experience;
            if (candidateData.salary !== undefined) insertData.salary = candidateData.salary;
            if (candidateData.skillsets && candidateData.skillsets.length > 0) insertData.skillsets = candidateData.skillsets;
            if (candidateData.past_companies && candidateData.past_companies.length > 0) insertData.past_companies = candidateData.past_companies;
            if (candidateData.general_notes) insertData.general_notes = candidateData.general_notes;

            const { data: newCandidate, error: createError } = await supabaseClient
              .from('candidates')
              .insert(insertData)
              .select('id')
              .single();

            if (!createError && newCandidate) {
              candidateId = newCandidate.id;
              progress.created++;
            } else {
              progress.errors++;
              progress.errorMessages.push(`Row ${actualRowNumber}: Create failed - ${createError?.message || 'Unknown error'}`);
              progress.processed++;
              continue;
            }
          }

          // Handle stage mapping and pipeline with better error handling
          let stageId = defaultStageId;
          if (candidateData.stage) {
            const mappedStage = candidateData.stage.toLowerCase().trim();
            stageId = stageMap.get(mappedStage) || 
                     fuzzyStageMap.get(mappedStage) || 
                     fuzzyStageMap.get(mappedStage.replace(/\s+/g, '')) ||
                     fuzzyStageMap.get(mappedStage.replace(/\s+/g, '_')) ||
                     defaultStageId;
          }

          // Handle pipeline entry with better conflict resolution
          const pipelineData = {
            applied_company: candidateData.applied_company || 'Unknown Company',
            applied_job_title: candidateData.applied_job_title || 'Unknown Position'
          };

          const { data: existingPipeline } = await supabaseClient
            .from('candidate_pipeline')
            .select('id')
            .eq('candidate_id', candidateId)
            .eq('applied_company', pipelineData.applied_company)
            .eq('applied_job_title', pipelineData.applied_job_title)
            .maybeSingle();

          if (existingPipeline) {
            await supabaseClient
              .from('candidate_pipeline')
              .update({
                stage_id: stageId,
                is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
                notes: candidateData.general_notes,
                updated_at: new Date().toISOString(),
                moved_at: new Date().toISOString()
              })
              .eq('id', existingPipeline.id);
          } else {
            await supabaseClient
              .from('candidate_pipeline')
              .insert({
                candidate_id: candidateId,
                stage_id: stageId,
                notes: candidateData.general_notes,
                is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
                applied_company: pipelineData.applied_company,
                applied_job_title: pipelineData.applied_job_title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                moved_at: new Date().toISOString()
              });
          }

          progress.processed++;

        } catch (error) {
          console.error(`❌ Row ${actualRowNumber} processing error:`, error);
          progress.errors++;
          progress.errorMessages.push(`Row ${actualRowNumber}: ${error.message}`);
          progress.processed++;
        }
        
        // Update progress after each row for more frequent updates
        progressStore.set(integrationId, { ...progress });
      }

      console.log(`✅ Batch completed: ${progress.processed}/${totalRows} processed (${progress.created} created, ${progress.updated} updated, ${progress.errors} errors)`);

      // Small delay between batches to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Mark as completed
    progress.status = 'completed';
    progressStore.set(integrationId, progress);

    console.log(`🎉 Sync completed: ${progress.processed}/${totalRows} processed, ${progress.created} created, ${progress.updated} updated, ${progress.errors} errors`);

  } catch (error) {
    console.error('❌ Background sync error:', error);
    const progress = progressStore.get(integrationId) || {
      processed: 0,
      total: 0,
      created: 0,
      updated: 0,
      errors: 1,
      status: 'error' as const,
      errorMessages: []
    };
    progress.status = 'error';
    progress.errorMessages.push(`Sync failed: ${error.message}`);
    progressStore.set(integrationId, progress);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { integrationId, sheetId, range, columnMappings, action } = await req.json()

    // Handle progress check requests
    if (action === 'check_progress') {
      const progress = progressStore.get(integrationId);
      return new Response(JSON.stringify({
        success: true,
        progress: progress || {
          processed: 0,
          total: 0,
          created: 0,
          updated: 0,
          errors: 0,
          status: 'idle',
          errorMessages: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Handle sync start requests
    if (!sheetId || !range) {
      throw new Error('Missing required parameters: sheetId and range')
    }

    console.log('🚀 Starting Google Sheets sync:', { sheetId, range, integrationId })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Google Service Account credentials and fetch data
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('Google Service Account key not found')
    }

    const serviceAccount = JSON.parse(serviceAccountKey)

    // Create JWT for authentication
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const privateKeyPem = serviceAccount.private_key.replace(/\\n/g, '\n')
    const pemContents = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')
    
    const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(`${header}.${payload}`)
    )
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const jwt = `${header}.${payload}.${signatureBase64}`

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch Google Sheets data with expanded range to get all data
    const expandedRange = range.includes('!') ? range : `${range}1:${range}1000`;
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${expandedRange}`
    const response = await fetch(sheetsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Filter out empty rows
    const filteredValues = data.values?.filter((row: any[]) => 
      row && row.some(cell => cell && cell.toString().trim())
    ) || [];

    const totalRows = Math.max(0, filteredValues.length - 1); // Subtract header row

    console.log(`📊 Fetched ${filteredValues.length} total rows, ${totalRows} data rows`);

    // Start background processing with filtered data
    EdgeRuntime.waitUntil(
      processSync(integrationId, supabaseClient, { values: filteredValues }, columnMappings || {})
    )

    // Return immediate response with correct total
    return new Response(JSON.stringify({
      success: true,
      message: 'Sync started successfully',
      totalRows: totalRows,
      backgroundProcessing: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Google Sheets sync error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
