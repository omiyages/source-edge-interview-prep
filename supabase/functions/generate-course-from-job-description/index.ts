
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!openAIApiKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasOpenAI: !!openAIApiKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey
      });
      throw new Error('Missing required environment variables');
    }

    console.log('OpenAI API Key exists:', !!openAIApiKey);
    console.log('OpenAI API Key length:', openAIApiKey.length);
    console.log('OpenAI API Key prefix:', openAIApiKey.substring(0, 10) + '...');

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all approved questions from the database
    const { data: questions, error: questionsError } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('status', 'approved');
    
    if (questionsError) throw questionsError;

    console.log(`Found ${questions?.length || 0} approved questions in database`);

    // Use OpenAI to analyze the job description and generate course structure
    const analysisPrompt = `
    Analyze this job description and create a structured interview course:

    Job Description:
    ${jobDescription}

    Based on this job description, provide a JSON response with:
    1. Course title (concise, professional)
    2. Course description (2-3 sentences)
    3. Suggested interview stages (array of objects with title, description, stage_order)
    4. Key skills and technologies mentioned
    5. Role level (entry, mid, senior, principal)
    6. Primary role category (Backend Engineer, Frontend Engineer, SRE/DevOps, Engineering Manager, etc.)

    Here are the available questions in the database:
    ${questions?.map(q => `- ID: ${q.id}, Question: ${q.question} (${q.role}, ${q.category}, ${q.difficulty})`).join('\n')}

    For each suggested stage, recommend specific question IDs from the list above that would be most relevant.

    Respond with valid JSON in this format:
    {
      "courseTitle": "string",
      "courseDescription": "string",
      "stages": [
        {
          "title": "string",
          "description": "string",
          "stage_order": number,
          "recommendedQuestionIds": ["uuid1", "uuid2"]
        }
      ],
      "keySkills": ["skill1", "skill2"],
      "roleLevel": "string",
      "primaryRole": "string"
    }
    `;

    console.log('Making request to OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical recruiter and interview designer. Analyze job descriptions and create comprehensive interview courses. Always respond with valid JSON only, no markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      // Handle specific error cases
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again, or upgrade your OpenAI plan for higher limits.');
      } else if (response.status === 401) {
        throw new Error('Invalid OpenAI API key or insufficient permissions. Please check your API key configuration and ensure it has access to GPT models.');
      } else if (response.status === 403) {
        throw new Error('OpenAI API access forbidden. Please check your API key permissions and billing status.');
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${response.statusText}. Details: ${errorText}`);
      }
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received successfully');

    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      console.error('Invalid OpenAI response structure:', aiResponse);
      throw new Error('Invalid response format from OpenAI API');
    }

    let analysis;
    try {
      let content = aiResponse.choices[0].message.content;
      console.log('Raw OpenAI response content:', content);
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        console.log('Cleaned content after removing markdown:', content);
      }
      
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse.choices[0].message.content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    console.log('Course analysis completed successfully');

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-course-from-job-description:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
