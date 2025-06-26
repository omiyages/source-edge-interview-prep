
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
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all approved questions from the database
    const { data: questions, error: questionsError } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('status', 'approved');
    
    if (questionsError) throw questionsError;

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
    ${questions?.map(q => `- ${q.question} (${q.role}, ${q.category}, ${q.difficulty})`).join('\n')}

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
            content: 'You are an expert technical recruiter and interview designer. Analyze job descriptions and create comprehensive interview courses. Always respond with valid JSON only.'
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-course-from-job-description:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
