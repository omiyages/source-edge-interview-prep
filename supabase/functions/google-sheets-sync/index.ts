
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

// Add progress tracking function
async function updateProgress(supabaseClient: any, integrationId: string, progress: any) {
  try {
    // Use a simple approach to track progress - could be enhanced with a progress table
    console.log(`📊 Progress Update: ${progress.processed}/${progress.total} - Created: ${progress.created}, Updated: ${progress.updated}, Errors: ${progress.errors}`);
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { integrationId, sheetId, range, columnMappings } = await req.json()
    
    if (!sheetId || !range) {
      throw new Error('Missing required parameters: sheetId and range')
    }

    console.log('🚀 Starting optimized Google Sheets sync:', { sheetId, range, totalMappings: Object.keys(columnMappings || {}).length })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Google Service Account credentials
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('Google Service Account key not found')
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(serviceAccountKey)
    } catch (error) {
      throw new Error('Invalid Google Service Account JSON')
    }

    // Create JWT for service account authentication
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // Create JWT header and payload
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    // Import private key for signing
    const privateKeyPem = serviceAccount.private_key.replace(/\\n/g, '\n')
    
    // Remove PEM headers and footers and decode base64
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

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(`${header}.${payload}`)
    )
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const jwt = `${header}.${payload}.${signatureBase64}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch data from Google Sheets using access token
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`
    console.log('📊 Fetching from Google Sheets:', sheetsUrl)
    
    const response = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const rows = data.values || []
    
    if (rows.length < 2) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No data found in the specified range'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Get header row and data rows
    const headers = rows[0]
    const dataRows = rows.slice(1)
    
    console.log('📋 Data Summary:', {
      headers: headers.length,
      totalRows: dataRows.length,
      mappings: Object.keys(columnMappings || {}).length
    })

    // Pre-load hiring stages for mapping
    const { data: stages } = await supabaseClient
      .from('hiring_stages')
      .select('id, name')
      .order('order_index')

    const stageMap = new Map(stages?.map(s => [s.name.toLowerCase(), s.id]) || [])
    
    // Create comprehensive stage mapping
    const fuzzyStageMap = new Map()
    stages?.forEach(stage => {
      const name = stage.name.toLowerCase()
      fuzzyStageMap.set(name, stage.id)
      fuzzyStageMap.set(name.replace(/\s+/g, ''), stage.id)
      fuzzyStageMap.set(name.replace(/\s+/g, '_'), stage.id)
      fuzzyStageMap.set(name.replace(/\s+/g, '-'), stage.id)
      
      // Common stage name variations
      if (name.includes('interview')) {
        const num = name.match(/\d+/)?.[0]
        if (num) {
          fuzzyStageMap.set(`interview${num}`, stage.id)
          fuzzyStageMap.set(`int${num}`, stage.id)
        }
      }
      if (name.includes('technical')) {
        fuzzyStageMap.set('tech', stage.id)
        fuzzyStageMap.set('technical', stage.id)
      }
      if (name.includes('hr')) {
        fuzzyStageMap.set('hr', stage.id)
        fuzzyStageMap.set('hr screen', stage.id)
        fuzzyStageMap.set('hrscreen', stage.id)
      }
    })
    
    const defaultStageId = stages?.[0]?.id

    console.log('🎯 Stage mapping ready:', {
      totalStages: stages?.length || 0,
      fuzzyMappings: fuzzyStageMap.size,
      defaultStageId
    })

    // Progress tracking
    let processedCount = 0
    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0
    let defaultStageCount = 0
    const errors: string[] = []
    const totalRows = dataRows.length

    console.log(`🚀 Starting to process ${totalRows} rows in optimized batches`)

    // Use smaller batch sizes to prevent timeouts and allow better progress tracking
    const batchSize = 5 // Reduced batch size for better control
    const maxErrors = 50 // Stop if too many errors
    
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize)
      const batchNumber = Math.floor(i/batchSize) + 1
      const totalBatches = Math.ceil(totalRows/batchSize)
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (rows ${i + 2} to ${Math.min(i + batchSize + 1, totalRows + 1)})`)
      
      // Process each row in the current batch
      for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
        const row = batch[rowIndex]
        const actualRowNumber = i + rowIndex + 2 // +2 for header row and 1-based indexing
        
        try {
          const candidateData: CandidateData = {
            full_name: '',
            is_active: true
          }
          
          // Map spreadsheet columns to candidate fields
          headers.forEach((header, index) => {
            const value = row[index]?.toString()?.trim()
            if (!value) return

            const mapping = columnMappings[header]
            if (!mapping) return

            switch (mapping) {
              case 'full_name':
                candidateData.full_name = value
                break
              case 'email':
                candidateData.email = value
                break
              case 'phone_number':
                candidateData.phone_number = value
                break
              case 'linkedin_profile':
                candidateData.linkedin_profile = value
                break
              case 'current_company':
                candidateData.current_company = value
                break
              case 'applied_company':
                candidateData.applied_company = value
                break
              case 'applied_job_title':
                candidateData.applied_job_title = value
                break
              case 'years_of_experience':
                const exp = parseInt(value)
                if (!isNaN(exp)) candidateData.years_of_experience = exp
                break
              case 'salary':
                const sal = parseInt(value.replace(/[,$]/g, ''))
                if (!isNaN(sal)) candidateData.salary = sal
                break
              case 'skillsets':
                candidateData.skillsets = value.split(',').map(s => s.trim()).filter(Boolean)
                break
              case 'past_companies':
                candidateData.past_companies = value.split(',').map(s => s.trim()).filter(Boolean)
                break
              case 'general_notes':
                candidateData.general_notes = value
                break
              case 'kanban_stage':
              case 'stage':
                candidateData.stage = value
                break
              case 'is_active':
                const lowerValue = value.toLowerCase().trim()
                candidateData.is_active = lowerValue === 'yes' || lowerValue === 'active' || lowerValue === 'true' || lowerValue === '1'
                break
            }
          })

          if (!candidateData.full_name) {
            errors.push(`Row ${actualRowNumber}: Missing candidate name`)
            errorCount++
            continue
          }

          let candidateId: string
          let isUpdate = false

          // Check for existing candidate
          const { data: existingCandidate, error: lookupError } = await supabaseClient
            .from('candidates')
            .select('id')
            .eq('full_name', candidateData.full_name)
            .maybeSingle()

          if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('❌ Candidate lookup error:', lookupError)
            errors.push(`Row ${actualRowNumber}: Database lookup failed - ${lookupError.message}`)
            errorCount++
            continue
          }

          if (existingCandidate) {
            // Update existing candidate
            isUpdate = true
            candidateId = existingCandidate.id
            
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
              .eq('id', candidateId)

            if (updateError) {
              console.error('❌ Update error:', updateError)
              errors.push(`Row ${actualRowNumber}: Failed to update - ${updateError.message}`)
              errorCount++
              continue
            }

            updatedCount++
            console.log(`✅ Updated: ${candidateData.full_name}`)
          } else {
            // Create new candidate with proper error handling
            try {
              const { data: newCandidate, error: candidateError } = await supabaseClient
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
                .single()

              if (candidateError) {
                // Handle duplicate key errors gracefully
                if (candidateError.code === '23505' && candidateError.message?.includes('full_name')) {
                  console.log(`🔄 Handling duplicate for: ${candidateData.full_name}`)
                  
                  // Try to find the existing candidate
                  const { data: retryCandidate, error: retryError } = await supabaseClient
                    .from('candidates')
                    .select('id')
                    .eq('full_name', candidateData.full_name)
                    .single()
                  
                  if (!retryError && retryCandidate) {
                    candidateId = retryCandidate.id
                    isUpdate = true
                    updatedCount++
                    console.log(`✅ Found existing: ${candidateData.full_name}`)
                  } else {
                    throw new Error(`Failed to handle duplicate: ${candidateError.message}`)
                  }
                } else {
                  throw candidateError
                }
              } else {
                candidateId = newCandidate.id
                createdCount++
                console.log(`✅ Created: ${candidateData.full_name}`)
              }
            } catch (error) {
              console.error('❌ Create error:', error)
              errors.push(`Row ${actualRowNumber}: Failed to create - ${error.message}`)
              errorCount++
              continue
            }
          }

          // Handle stage mapping
          let stageId = defaultStageId
          let usedDefault = false

          if (candidateData.stage) {
            const mappedStage = candidateData.stage.toLowerCase().trim()
            let mappedStageId = stageMap.get(mappedStage) ||
                             fuzzyStageMap.get(mappedStage) ||
                             fuzzyStageMap.get(mappedStage.replace(/\s+/g, '')) ||
                             fuzzyStageMap.get(mappedStage.replace(/\s+/g, '_'))
            
            if (mappedStageId) {
              stageId = mappedStageId
            } else {
              usedDefault = true
              defaultStageCount++
            }
          } else {
            usedDefault = true
            defaultStageCount++
          }

          // Handle pipeline entry
          const { data: existingPipeline } = await supabaseClient
            .from('candidate_pipeline')
            .select('id, stage_id, is_active')
            .eq('candidate_id', candidateId)
            .eq('applied_company', candidateData.applied_company || '')
            .eq('applied_job_title', candidateData.applied_job_title || '')
            .maybeSingle()

          if (existingPipeline) {
            // Update if needed
            if (existingPipeline.stage_id !== stageId || existingPipeline.is_active !== (candidateData.is_active !== undefined ? candidateData.is_active : true)) {
              const { error: pipelineUpdateError } = await supabaseClient
                .from('candidate_pipeline')
                .update({
                  stage_id: stageId,
                  is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
                  notes: candidateData.general_notes,
                  updated_at: new Date().toISOString(),
                  moved_at: new Date().toISOString()
                })
                .eq('id', existingPipeline.id)

              if (pipelineUpdateError) {
                console.error('❌ Pipeline update error:', pipelineUpdateError)
              }
            }
          } else {
            // Create new pipeline entry
            const { error: pipelineError } = await supabaseClient
              .from('candidate_pipeline')
              .insert({
                candidate_id: candidateId,
                stage_id: stageId,
                notes: candidateData.general_notes,
                is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
                applied_company: candidateData.applied_company,
                applied_job_title: candidateData.applied_job_title
              })

            if (pipelineError) {
              console.error('❌ Pipeline create error:', pipelineError)
            }
          }

          processedCount++

        } catch (error) {
          console.error(`❌ Error processing row ${actualRowNumber}:`, error)
          errors.push(`Row ${actualRowNumber}: ${error.message}`)
          errorCount++
        }
      }

      // Progress update after each batch
      await updateProgress(supabaseClient, integrationId, {
        processed: processedCount,
        total: totalRows,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount
      })

      // Stop processing if too many errors
      if (errorCount > maxErrors) {
        console.log(`🛑 Stopping due to too many errors (${errorCount}/${maxErrors})`)
        break
      }

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < totalRows) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`🎉 Sync completed: ${processedCount}/${totalRows} processed`)
    console.log(`📊 Results: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors, ${defaultStageCount} used default stage`)

    return new Response(JSON.stringify({
      success: true,
      processedCount,
      createdCount,
      updatedCount,
      errorCount,
      defaultStageCount,
      totalRows,
      errors: errors.slice(0, 20),
      message: `Successfully processed ${processedCount} of ${totalRows} candidates (${createdCount} created, ${updatedCount} updated). ${errorCount} errors encountered.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Google Sheets sync error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
      details: {
        processed: 0,
        errors: 1
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
