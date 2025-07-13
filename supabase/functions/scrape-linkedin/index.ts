
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

    // Helper function to format date ranges
    const formatDateRange = (startDate: string | null, endDate: string | null) => {
      if (!startDate) return '';
      
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      };
      
      const start = formatDate(startDate);
      const end = endDate ? formatDate(endDate) : 'Present';
      return `${start} - ${end}`;
    };

    // Get current company from most recent experience
    let currentCompany = person.job_company_name || '';
    let yearsOfExperience = 0;

    // If we have experience array, use the most recent one for current company
    if (person.experience && person.experience.length > 0) {
      const currentJob = person.experience[0]; // Most recent job
      currentCompany = currentJob.company?.name || currentCompany;
    }

    // Calculate total years of experience
    if (person.experience && person.experience.length > 0) {
      let totalMonths = 0;
      
      person.experience.forEach((exp: any) => {
        if (exp.start_date) {
          const startDate = new Date(exp.start_date);
          const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
          
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
          totalMonths += Math.max(0, months);
        }
      });
      
      yearsOfExperience = Math.round(totalMonths / 12);
    } else if (person.job_start_date) {
      // Fallback to job_start_date if no experience array
      const startDate = new Date(person.job_start_date);
      const now = new Date();
      yearsOfExperience = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    }

    // Format past companies with job titles and date ranges
    const pastCompanies: string[] = [];
    if (person.experience && person.experience.length > 1) {
      // Skip the first one (current job) and format the rest
      person.experience.slice(1).forEach((exp: any) => {
        if (exp.company?.name) {
          const companyName = exp.company.name;
          const title = exp.title || 'N/A';
          const dateRange = formatDateRange(exp.start_date, exp.end_date);
          
          pastCompanies.push(`${companyName} - ${title} (${dateRange || 'Dates not available'})`);
        }
      });
    }

    // Transform People Data Labs response to our expected format
    const profileData = {
      name: person.full_name || '',
      company: currentCompany,
      experience: yearsOfExperience,
      skills: person.skills || [],
      pastCompanies: pastCompanies,
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
