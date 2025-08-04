
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { spreadsheetId, range } = await req.json()
    
    if (!spreadsheetId || !range) {
      throw new Error('Missing required parameters: spreadsheetId and range')
    }

    console.log('Starting Google Sheets sync with:', { spreadsheetId, range })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Google Sheets API key
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY')
    if (!apiKey) {
      throw new Error('Google Sheets API key not found')
    }

    // Fetch data from Google Sheets
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`
    console.log('Fetching from Google Sheets:', sheetsUrl)
    
    const response = await fetch(sheetsUrl)
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
    const headers = rows[0].map((h: string) => h.toLowerCase().trim())
    const dataRows = rows.slice(1)
    
    console.log('Headers found:', headers)
    console.log('Data rows count:', dataRows.length)

    // Get all hiring stages to map stage names
    const { data: stages } = await supabaseClient
      .from('hiring_stages')
      .select('id, name')
      .order('order_index')

    const stageMap = new Map(stages?.map(s => [s.name.toLowerCase(), s.id]) || [])
    const defaultStageId = stages?.[0]?.id // Use first stage as default

    console.log('Available stages:', stages?.map(s => s.name))

    let processedCount = 0
    let errorCount = 0
    let defaultStageCount = 0
    const errors: string[] = []

    // Process candidates in batches
    const batchSize = 10
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize)
      
      for (const row of batch) {
        try {
          const candidateData: CandidateData = {}
          
          // Map spreadsheet columns to candidate fields
          headers.forEach((header, index) => {
            const value = row[index]?.toString()?.trim()
            if (!value) return

            switch (header) {
              case 'name':
              case 'full_name':
              case 'candidate name':
                candidateData.full_name = value
                break
              case 'email':
              case 'email address':
                candidateData.email = value
                break
              case 'phone':
              case 'phone_number':
              case 'phone number':
                candidateData.phone_number = value
                break
              case 'linkedin':
              case 'linkedin_profile':
              case 'linkedin profile':
                candidateData.linkedin_profile = value
                break
              case 'company':
              case 'current_company':
              case 'current company':
                candidateData.current_company = value
                break
              case 'experience':
              case 'years_of_experience':
              case 'years of experience':
                const exp = parseInt(value)
                if (!isNaN(exp)) candidateData.years_of_experience = exp
                break
              case 'salary':
                const sal = parseInt(value.replace(/[,$]/g, ''))
                if (!isNaN(sal)) candidateData.salary = sal
                break
              case 'skills':
              case 'skillsets':
                candidateData.skillsets = value.split(',').map(s => s.trim()).filter(Boolean)
                break
              case 'past_companies':
              case 'past companies':
                candidateData.past_companies = value.split(',').map(s => s.trim()).filter(Boolean)
                break
              case 'notes':
              case 'general_notes':
                candidateData.general_notes = value
                break
              case 'stage':
              case 'hiring_stage':
                candidateData.stage = value
                break
            }
          })

          if (!candidateData.full_name) {
            errors.push(`Row ${i + 2}: Missing candidate name`)
            errorCount++
            continue
          }

          // Insert or update candidate
          const { data: candidate, error: candidateError } = await supabaseClient
            .from('candidates')
            .upsert({
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
            }, {
              onConflict: 'full_name',
              ignoreDuplicates: false
            })
            .select('id')
            .single()

          if (candidateError) {
            console.error('Candidate insert error:', candidateError)
            errors.push(`Row ${i + 2}: Failed to insert candidate - ${candidateError.message}`)
            errorCount++
            continue
          }

          // Determine stage
          let stageId = defaultStageId
          let usedDefault = false

          if (candidateData.stage) {
            // Map specific stages to "Interview 1"
            let mappedStage = candidateData.stage.toLowerCase()
            if (mappedStage === 'tech challenge' || mappedStage === 'hr screen') {
              mappedStage = 'interview 1'
            }
            
            const mappedStageId = stageMap.get(mappedStage)
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

          // Add to pipeline if not already there
          const { error: pipelineError } = await supabaseClient
            .from('candidate_pipeline')
            .upsert({
              candidate_id: candidate.id,
              stage_id: stageId,
              notes: candidateData.general_notes
            }, {
              onConflict: 'candidate_id',
              ignoreDuplicates: false
            })

          if (pipelineError) {
            console.error('Pipeline insert error:', pipelineError)
            errors.push(`Row ${i + 2}: Failed to add to pipeline - ${pipelineError.message}`)
            errorCount++
            continue
          }

          processedCount++
          console.log(`Processed candidate: ${candidateData.full_name}${usedDefault ? ' (default stage)' : ''}`)

        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          errors.push(`Row ${i + 2}: ${error.message}`)
          errorCount++
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const result = {
      success: true,
      message: `Successfully processed ${processedCount} candidates`,
      details: {
        processed: processedCount,
        errors: errorCount,
        defaultStageAssignments: defaultStageCount,
        errorMessages: errors.slice(0, 10) // Limit to first 10 errors
      }
    }

    console.log('Sync completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
