
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { integrationId, sheetId, range, columnMappings } = await req.json()
    
    if (!sheetId || !range) {
      throw new Error('Missing required parameters: sheetId and range')
    }

    console.log('Starting Google Sheets sync with:', { sheetId, range })

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
    console.log('Fetching from Google Sheets:', sheetsUrl)
    
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
    const headers = rows[0] // Keep original case for mapping
    const dataRows = rows.slice(1)
    
    console.log('Headers found:', headers)
    console.log('Data rows count:', dataRows.length)
    console.log('Column mappings:', columnMappings)

    // Get all hiring stages to map stage names
    const { data: stages } = await supabaseClient
      .from('hiring_stages')
      .select('id, name')
      .order('order_index')

    const stageMap = new Map(stages?.map(s => [s.name.toLowerCase(), s.id]) || [])
    
    // Create fuzzy stage mapping for common variations
    const fuzzyStageMap = new Map()
    stages?.forEach(stage => {
      const name = stage.name.toLowerCase()
      fuzzyStageMap.set(name, stage.id)
      fuzzyStageMap.set(name.replace(/\s+/g, ''), stage.id) // no spaces
      fuzzyStageMap.set(name.replace(/\s+/g, '_'), stage.id) // underscores
      fuzzyStageMap.set(name.replace(/\s+/g, '-'), stage.id) // dashes
      
      // Common abbreviations and variations
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
    
    const defaultStageId = stages?.[0]?.id // Use first stage as default

    console.log('Available stages:', stages?.map(s => s.name))
    console.log('Fuzzy mappings created for:', Array.from(fuzzyStageMap.keys()))

    let processedCount = 0
    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0
    let defaultStageCount = 0
    const errors: string[] = []
    const totalRows = dataRows.length

    console.log(`Starting to process ${totalRows} rows`)

    // Process candidates in batches
    const batchSize = 5
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize)
      
      for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
        const row = batch[rowIndex]
        const actualRowNumber = i + rowIndex + 2 // +2 for header row and 1-based indexing
        
        try {
          const candidateData: CandidateData = {
            is_active: true // Default to active
          }
          
          // Map spreadsheet columns to candidate fields using column mappings
          headers.forEach((header, index) => {
            const value = row[index]?.toString()?.trim()
            if (!value) return

            // Get the mapping for this header
            const mapping = columnMappings[header]
            if (!mapping) return

            console.log(`Mapping ${header} (${mapping}): ${value}`)

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
                // Handle Yes/No for active status - Yes = Active, No = Inactive
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

          // First, check if candidate exists by name only (due to unique constraint)
          const { data: existingCandidate } = await supabaseClient
            .from('candidates')
            .select('id')
            .eq('full_name', candidateData.full_name)
            .maybeSingle()

          let candidateId: string
          let isUpdate = false

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
              console.error('Candidate update error:', updateError)
              errors.push(`Row ${actualRowNumber}: Failed to update candidate - ${updateError.message}`)
              errorCount++
              continue
            }

            updatedCount++
            console.log(`📝 Updated existing candidate: ${candidateData.full_name}`)
          } else {
            // Create new candidate
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
              console.error('Candidate insert error:', candidateError)
              errors.push(`Row ${actualRowNumber}: Failed to create candidate - ${candidateError.message}`)
              errorCount++
              continue
            }

            candidateId = newCandidate.id
            createdCount++
            console.log(`✨ Created new candidate: ${candidateData.full_name}`)
          }

          // Determine stage
          let stageId = defaultStageId
          let usedDefault = false

          if (candidateData.stage) {
            // Try exact match first
            let mappedStage = candidateData.stage.toLowerCase().trim()
            let mappedStageId = stageMap.get(mappedStage)
            
            // If no exact match, try fuzzy matching
            if (!mappedStageId) {
              mappedStageId = fuzzyStageMap.get(mappedStage) || 
                             fuzzyStageMap.get(mappedStage.replace(/\s+/g, '')) ||
                             fuzzyStageMap.get(mappedStage.replace(/\s+/g, '_')) ||
                             fuzzyStageMap.get(mappedStage.replace(/\s+/g, '-'))
            }
            
            if (mappedStageId) {
              stageId = mappedStageId
              console.log(`Mapped "${candidateData.stage}" to stage ID: ${stageId}`)
            } else {
              usedDefault = true
              defaultStageCount++
              console.log(`No stage mapping found for "${candidateData.stage}", using default`)
            }
          } else {
            usedDefault = true
            defaultStageCount++
          }

          // Now handle the pipeline entry - check if this specific combination exists
          const { data: existingPipeline } = await supabaseClient
            .from('candidate_pipeline')
            .select('id, stage_id, is_active')
            .eq('candidate_id', candidateId)
            .eq('applied_company', candidateData.applied_company || '')
            .eq('applied_job_title', candidateData.applied_job_title || '')
            .maybeSingle()

          if (existingPipeline) {
            // Update pipeline if stage or active status changed
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
                console.error('Pipeline update error:', pipelineUpdateError)
                errors.push(`Row ${actualRowNumber}: Failed to update pipeline - ${pipelineUpdateError.message}`)
                errorCount++
                continue
              }
              console.log(`📝 Updated pipeline for: ${candidateData.full_name}`)
            } else {
              console.log(`✅ Pipeline unchanged for: ${candidateData.full_name}`)
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
              console.error('Pipeline insert error:', pipelineError)
              errors.push(`Row ${actualRowNumber}: Failed to create pipeline - ${pipelineError.message}`)
              errorCount++
              continue
            }
            console.log(`✨ Created new pipeline for: ${candidateData.full_name}`)
          }

          processedCount++
          console.log(`✅ Processed candidate ${processedCount}/${totalRows}: ${candidateData.full_name} (${isUpdate ? 'updated' : 'created'})${usedDefault ? ' (default stage)' : ''}`)

          // Log progress every 5 candidates or on last candidate
          if (processedCount % 5 === 0 || processedCount === totalRows) {
            console.log(`📊 Progress: ${processedCount}/${totalRows} (${Math.round(processedCount/totalRows*100)}%) - Created: ${createdCount}, Updated: ${updatedCount}`)
          }

        } catch (error) {
          console.error(`Error processing row ${actualRowNumber}:`, error)
          errors.push(`Row ${actualRowNumber}: ${error.message}`)
          errorCount++
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`🎉 Sync completed: ${processedCount} processed (${createdCount} created, ${updatedCount} updated), ${errorCount} errors, ${defaultStageCount} used default stage`)

    return new Response(JSON.stringify({
      success: true,
      processedCount,
      createdCount,
      updatedCount,
      errorCount,
      defaultStageCount,
      totalRows,
      errors: errors.slice(0, 10), // Limit error messages
      message: `Successfully processed ${processedCount} candidates (${createdCount} created, ${updatedCount} updated). ${defaultStageCount} candidates were assigned to the default stage due to stage mapping issues.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Google Sheets sync error:', error)
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
