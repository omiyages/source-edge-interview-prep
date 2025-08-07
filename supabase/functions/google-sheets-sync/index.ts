

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

    // Fetch data from Google Sheets
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    console.log('📡 Fetching from Google Sheets...');
    
    const sheetsResponse = await fetch(sheetsUrl);
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('❌ Google Sheets API error:', sheetsResponse.status, errorText);
      throw new Error(`Google Sheets API error: ${sheetsResponse.statusText}`);
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

            // Apply column mappings with better data processing
            Object.entries(columnMappings || {}).forEach(([field, columnIndex]) => {
              const index = parseInt(columnIndex as string);
              if (index >= 0 && index < row.length && row[index]) {
                const value = row[index].toString().trim();
                
                if (value) {
                  switch (field) {
                    case 'skillsets':
                    case 'past_companies':
                      // Handle array fields by splitting on common delimiters
                      candidateData[field] = value.split(/[,;|\n]/).map(item => item.trim()).filter(item => item);
                      break;
                    case 'years_of_experience':
                      // Extract numeric value from experience strings
                      const numMatch = value.match(/(\d+)/);
                      candidateData[field] = numMatch ? parseInt(numMatch[1]) : null;
                      break;
                    case 'salary':
                      // Extract numeric value from salary strings
                      const salaryMatch = value.replace(/[$,]/g, '').match(/(\d+)/);
                      candidateData[field] = salaryMatch ? parseInt(salaryMatch[1]) : null;
                      break;
                    case 'email':
                      // Validate email format
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      candidateData[field] = emailRegex.test(value) ? value : `${value.replace(/[^a-zA-Z0-9]/g, '')}@noemail.local`;
                      break;
                    default:
                      candidateData[field] = value;
                  }
                }
              }
            });

            // Skip rows without essential data
            if (!candidateData.full_name) {
              console.log('⚠️ Skipping row without name');
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
