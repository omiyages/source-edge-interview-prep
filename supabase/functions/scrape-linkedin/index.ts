
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes('linkedin.com')) {
      throw new Error('Invalid LinkedIn URL');
    }

    const pdlApiKey = Deno.env.get('PEOPLE_DATA_LABS_API_KEY');
    if (!pdlApiKey) {
      throw new Error('People Data Labs API key not configured');
    }

    console.log('Calling People Data Labs API with LinkedIn URL:', url);

    // Construct the API URL with query parameters - use 'profile' parameter for LinkedIn URLs
    const apiUrl = `https://api.peopledatalabs.com/v5/person/enrich?profile=${encodeURIComponent(url)}`;
    
    // Call People Data Labs Person Enrichment API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': pdlApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('People Data Labs API error:', response.status, errorText);
      throw new Error(`People Data Labs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('People Data Labs response:', data);

    if (!data || data.status !== 200) {
      throw new Error('No data found for this LinkedIn profile');
    }

    const person = data.data;

    // Transform People Data Labs response to our expected format
    const profileData = {
      name: person.full_name || '',
      company: person.job_company_name || person.experience?.[0]?.company?.name || '',
      experience: person.job_start_date ? 
        Math.floor((new Date().getTime() - new Date(person.job_start_date).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 
        person.experience?.length || 0,
      skills: person.skills || [],
      pastCompanies: person.experience ? 
        person.experience.slice(1).map((exp: any) => exp.company?.name).filter(Boolean) : 
        [],
      note: `Profile imported from LinkedIn via People Data Labs: ${url}. Last updated: ${new Date().toISOString()}`
    };

    console.log('Transformed profile data:', profileData);

    return new Response(
      JSON.stringify(profileData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-linkedin function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
