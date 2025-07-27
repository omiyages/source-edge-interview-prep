
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integrationId, sheetId, range, columnMappings } = await req.json();
    
    const googleApiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Set the user context
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Fetching Google Sheets data for sheet:', sheetId);
    
    // Fetch data from Google Sheets
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${googleApiKey}`;
    const response = await fetch(sheetsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', response.status, errorText);
      
      // Provide more specific error messages
      if (response.status === 403) {
        throw new Error('Permission denied: Make sure the Google Sheet is publicly accessible or the API key has proper permissions. You can make the sheet public by clicking "Share" > "Anyone with the link can view".');
      } else if (response.status === 404) {
        throw new Error('Sheet not found: Please check that the Sheet ID is correct and the sheet exists.');
      } else if (response.status === 400) {
        throw new Error('Invalid request: Please check the range specification (e.g., "A:Z" or "Sheet1!A1:Z100").');
      } else {
        throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Google Sheets response:', data);

    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in the specified range. Please check that your sheet contains data in the specified range.');
    }

    const [headers, ...rows] = data.values;
    const candidates = [];

    // Process each row and create candidate data
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const candidateData: any = {
        id: crypto.randomUUID(),
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      let appliedCompany = null;
      let appliedJobTitle = null;

      // Map columns based on columnMappings
      headers.forEach((header: string, index: number) => {
        const mapping = columnMappings[header];
        if (mapping && row[index]) {
          switch (mapping) {
            case 'email':
              candidateData.email = row[index];
              break;
            case 'full_name':
              candidateData.full_name = row[index];
              break;
            case 'linkedin_profile':
              candidateData.linkedin_profile = row[index];
              break;
            case 'current_company':
              candidateData.current_company = row[index];
              break;
            case 'phone_number':
              candidateData.phone_number = row[index];
              break;
            case 'years_of_experience':
              candidateData.years_of_experience = parseInt(row[index]) || null;
              break;
            case 'salary':
              candidateData.salary = parseInt(row[index]) || null;
              break;
            case 'skillsets':
              candidateData.skillsets = row[index].split(',').map((s: string) => s.trim());
              break;
            case 'past_companies':
              candidateData.past_companies = row[index].split(',').map((s: string) => s.trim());
              break;
            case 'general_notes':
              candidateData.general_notes = row[index];
              break;
            case 'applied_company':
              appliedCompany = row[index];
              break;
            case 'applied_job_title':
              appliedJobTitle = row[index];
              break;
          }
        }
      });

      // Email is required
      if (!candidateData.email) {
        console.log(`Skipping row ${i + 2}: No email found`);
        continue;
      }

      // Check if candidate already exists
      const { data: existingCandidate } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', candidateData.email)
        .eq('role', 'user')
        .single();

      let candidateId;
      if (existingCandidate) {
        // Update existing candidate
        candidateId = existingCandidate.id;
        const { error: updateError } = await supabase
          .from('profiles')
          .update(candidateData)
          .eq('id', candidateId);

        if (updateError) {
          console.error('Error updating candidate:', updateError);
          continue;
        }
      } else {
        // Create new candidate
        const { data: newCandidate, error: insertError } = await supabase
          .from('profiles')
          .insert(candidateData)
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting candidate:', insertError);
          continue;
        }
        candidateId = newCandidate.id;
      }

      // Handle pipeline entry with applied company and job title
      if (appliedCompany || appliedJobTitle) {
        // Get the first hiring stage (typically "Applied" or similar)
        const { data: firstStage } = await supabase
          .from('hiring_stages')
          .select('id')
          .order('stage_order', { ascending: true })
          .limit(1)
          .single();

        if (firstStage) {
          // Check if candidate is already in pipeline
          const { data: existingPipeline } = await supabase
            .from('candidate_pipeline')
            .select('id')
            .eq('candidate_id', candidateId)
            .eq('is_active', true)
            .single();

          if (existingPipeline) {
            // Update existing pipeline entry
            await supabase
              .from('candidate_pipeline')
              .update({
                applied_company: appliedCompany,
                applied_job_title: appliedJobTitle,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingPipeline.id);
          } else {
            // Create new pipeline entry
            await supabase
              .from('candidate_pipeline')
              .insert({
                candidate_id: candidateId,
                stage_id: firstStage.id,
                applied_company: appliedCompany,
                applied_job_title: appliedJobTitle,
                moved_by: user.id,
                is_active: true,
              });
          }
        }
      }

      // Track the import
      await supabase
        .from('google_sheets_candidate_imports')
        .upsert({
          integration_id: integrationId,
          candidate_id: candidateId,
          sheet_row_number: i + 2, // +2 because we skip header and arrays are 0-indexed
          import_data: Object.fromEntries(
            headers.map((header: string, index: number) => [header, row[index]])
          ),
        });

      candidates.push({
        id: candidateId,
        email: candidateData.email,
        full_name: candidateData.full_name,
        applied_company: appliedCompany,
        applied_job_title: appliedJobTitle,
        row: i + 2
      });
    }

    // Update last sync time
    await supabase
      .from('google_sheets_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integrationId);

    return new Response(
      JSON.stringify({
        success: true,
        imported_count: candidates.length,
        candidates: candidates
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
