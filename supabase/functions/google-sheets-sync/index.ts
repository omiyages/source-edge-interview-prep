
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

// Background sync processor with timeout management
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

    // Initialize progress
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

    // Pre-load hiring stages
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
    });
    
    const defaultStageId = stages?.[0]?.id;

    // Process in larger batches with timeout checks
    const batchSize = 25; // Increased batch size for better performance
    const maxProcessingTime = 4 * 60 * 1000; // 4 minutes max processing time
    const startTime = Date.now();

    for (let i = 0; i < dataRows.length; i += batchSize) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > maxProcessingTime) {
        console.log('⏰ Approaching timeout, stopping processing');
        progress.status = 'error';
        progress.errorMessages.push('Processing stopped due to timeout. Please try with smaller batches.');
        progressStore.set(integrationId, progress);
        break;
      }

      const batch = dataRows.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(totalRows/batchSize)} (rows ${i + 2} to ${Math.min(i + batchSize + 1, totalRows + 1)})`);

      // Process batch with Promise.all for parallel processing
      const batchPromises = batch.map(async (row, batchIndex) => {
        const actualRowNumber = i + batchIndex + 2;
        
        try {
          const candidateData: CandidateData = { full_name: '', is_active: true };
          
          // Map data from row
          headers.forEach((header, index) => {
            const value = row[index]?.toString()?.trim();
            if (!value) return;

            const mapping = columnMappings[header];
            if (!mapping) return;

            switch (mapping) {
              case 'full_name':
                candidateData.full_name = value;
                break;
              case 'email':
                candidateData.email = value;
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
                const exp = parseInt(value);
                if (!isNaN(exp)) candidateData.years_of_experience = exp;
                break;
              case 'salary':
                const sal = parseInt(value.replace(/[,$]/g, ''));
                if (!isNaN(sal)) candidateData.salary = sal;
                break;
              case 'skillsets':
                candidateData.skillsets = value.split(',').map(s => s.trim()).filter(Boolean);
                break;
              case 'past_companies':
                candidateData.past_companies = value.split(',').map(s => s.trim()).filter(Boolean);
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
                candidateData.is_active = lowerValue === 'yes' || lowerValue === 'active' || lowerValue === 'true' || lowerValue === '1';
                break;
            }
          });

          if (!candidateData.full_name) {
            progress.errors++;
            progress.errorMessages.push(`Row ${actualRowNumber}: Missing candidate name`);
            return;
          }

          // Check for existing candidate
          const { data: existingCandidate } = await supabaseClient
            .from('candidates')
            .select('id')
            .eq('full_name', candidateData.full_name)
            .maybeSingle();

          let candidateId: string;
          
          if (existingCandidate) {
            // Update existing
            const { error: updateError } = await supabaseClient
              .from('candidates')
              .update({
                email: candidateData.email || null,
                phone_number: candidateData.phone_number,
                linkedin_profile: candidateData.linkedin_profile,
                current_company: candidateData.current_company,
                years_of_experience: candidateData.years_of_experience,
                salary: candidateData.salary,
                skillsets: candidateData.skillsets || [],
                past_companies: candidateData.past_companies || [],
                general_notes: candidateData.general_notes,
                is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingCandidate.id);

            if (!updateError) {
              candidateId = existingCandidate.id;
              progress.updated++;
            } else {
              progress.errors++;
              progress.errorMessages.push(`Row ${actualRowNumber}: Update failed - ${updateError.message}`);
              return;
            }
          } else {
            // Create new
            const { data: newCandidate, error: createError } = await supabaseClient
              .from('candidates')
              .insert({
                full_name: candidateData.full_name,
                email: candidateData.email || null,
                phone_number: candidateData.phone_number,
                linkedin_profile: candidateData.linkedin_profile,
                current_company: candidateData.current_company,
                years_of_experience: candidateData.years_of_experience,
                salary: candidateData.salary,
                skillsets: candidateData.skillsets || [],
                past_companies: candidateData.past_companies || [],
                general_notes: candidateData.general_notes,
                is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
              })
              .select('id')
              .single();

            if (!createError && newCandidate) {
              candidateId = newCandidate.id;
              progress.created++;
            } else {
              progress.errors++;
              progress.errorMessages.push(`Row ${actualRowNumber}: Create failed - ${createError?.message || 'Unknown error'}`);
              return;
            }
          }

          // Handle stage mapping and pipeline
          let stageId = defaultStageId;
          if (candidateData.stage) {
            const mappedStage = candidateData.stage.toLowerCase().trim();
            stageId = stageMap.get(mappedStage) || fuzzyStageMap.get(mappedStage) || defaultStageId;
          }

          // Handle pipeline entry
          const { data: existingPipeline } = await supabaseClient
            .from('candidate_pipeline')
            .select('id')
            .eq('candidate_id', candidateId)
            .eq('applied_company', candidateData.applied_company || '')
            .eq('applied_job_title', candidateData.applied_job_title || '')
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
                applied_company: candidateData.applied_company,
                applied_job_title: candidateData.applied_job_title
              });
          }

          progress.processed++;

        } catch (error) {
          progress.errors++;
          progress.errorMessages.push(`Row ${actualRowNumber}: ${error.message}`);
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);
      
      // Update progress after each batch
      progressStore.set(integrationId, { ...progress });
      
      console.log(`✅ Batch completed: ${progress.processed}/${totalRows} processed (${progress.created} created, ${progress.updated} updated, ${progress.errors} errors)`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
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
    progress.errorMessages.push(error.message);
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

    // Fetch Google Sheets data
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`
    const response = await fetch(sheetsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Start background processing
    EdgeRuntime.waitUntil(
      processSync(integrationId, supabaseClient, data, columnMappings || {})
    )

    // Return immediate response
    return new Response(JSON.stringify({
      success: true,
      message: 'Sync started successfully',
      totalRows: (data.values?.length || 1) - 1,
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
