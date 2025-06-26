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
    const { jobDescription, jobTitle = "", company = "" } = await req.json();
    
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

    // Build the job context
    let jobContext = `Job Description:\n${jobDescription}`;
    if (jobTitle) {
      jobContext = `Job Title: ${jobTitle}\n` + jobContext;
    }
    if (company) {
      jobContext = `Company: ${company}\n` + jobContext;
    }

    // Special handling for Woven by Toyota
    const isWovenToyota = company.toLowerCase().includes('woven') && company.toLowerCase().includes('toyota');
    
    let stageGuidance = '';
    if (isWovenToyota) {
      stageGuidance = `
      Since this is for Woven by Toyota, the interview stages should be:
      1. HR Screening - Focus on cultural fit, communication skills, and basic qualifications
      2. Technical Assignment - Take-home coding challenge reflecting real-world problems
      3. Technical Assessment/Cross-Functional - Technical deep-dive with collaboration scenarios
      4. Final Interview - Leadership potential and strategic thinking assessment
      
      Make the descriptions comprehensive and helpful for candidate preparation.
      `;
    }

    // Use OpenAI to analyze the job description and generate course structure
    const analysisPrompt = `
    Analyze this job information and create a structured interview course:

    ${jobContext}

    ${stageGuidance}

    Based on this information, provide a JSON response with:
    1. Course title (concise, professional, incorporating job title and company if provided)
    2. Course description (2-3 sentences that mention the specific role and company)
    3. Suggested interview stages (array of objects with title, description, stage_order)
    4. Key skills and technologies mentioned
    5. Role level (entry, mid, senior, principal)
    6. Primary role category (Backend Engineer, Frontend Engineer, SRE/DevOps, Engineering Manager, etc.)

    For stage descriptions, make them comprehensive (3-4 sentences) and include:
    - What to expect in the interview
    - How candidates can prepare
    - What skills/qualities are being assessed
    - Practical tips for success

    Here are the available questions in the database:
    ${questions?.map(q => `- ID: ${q.id}, Question: ${q.question} (${q.role}, ${q.category}, ${q.difficulty}, ${q.interview_stage})`).join('\n')}

    For each suggested stage, recommend specific question IDs from the list above that would be most relevant based on:
    - The stage type (HR Screening, Technical Assessment, etc.)
    - The role and company context
    - The difficulty level appropriate for the role level
    - The question category and interview stage

    Match questions intelligently:
    - HR Screening: behavioral, cultural fit questions
    - Technical Assignment/Assessment: coding, system design, technical questions
    - Final Interview: leadership, strategic thinking questions

    Respond with valid JSON in this format:
    {
      "courseTitle": "string",
      "courseDescription": "string",
      "stages": [
        {
          "title": "string",
          "description": "string (comprehensive, 3-4 sentences)",
          "stage_order": number,
          "recommendedQuestionIds": ["uuid1", "uuid2", "uuid3"]
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
            content: 'You are an expert technical recruiter and interview designer. Analyze job descriptions and create comprehensive interview courses with relevant question selection. Always respond with valid JSON only, no markdown formatting or code blocks. Make stage descriptions detailed and helpful for candidate preparation. Select 2-4 relevant questions per stage based on the stage type, role context, and question metadata.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
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

    // Special handling for Woven by Toyota - override with predefined stages but keep question selection
    if (isWovenToyota && analysis.stages) {
      const wovenStages = [
        {
          title: "HR Screening",
          description: "This initial screening focuses on cultural fit, communication skills, and basic qualifications. Expect questions about your background, motivation for joining Woven by Toyota, understanding of our mobility vision, and general behavioral questions. Prepare by researching Toyota's values, Woven's mission in mobility technology, and be ready to discuss your career goals and how they align with our company culture. This stage typically lasts 30-45 minutes and sets the foundation for the technical rounds.",
          stage_order: 1,
          recommendedQuestionIds: analysis.stages[0]?.recommendedQuestionIds || []
        },
        {
          title: "Technical Assignment",
          description: "A take-home coding challenge that reflects real-world problems you'd solve at Woven by Toyota. This assignment tests your ability to write clean, maintainable code, follow best practices, and solve complex technical problems independently. You'll typically have 2-3 days to complete it. Focus on code quality, documentation, testing, and architectural decisions. The assignment often involves data processing, API integration, or system design relevant to mobility and automotive technology.",
          stage_order: 2,
          recommendedQuestionIds: analysis.stages[1]?.recommendedQuestionIds || []
        },
        {
          title: "Technical Assessment/Cross-Functional",
          description: "This comprehensive interview combines technical deep-dive discussions with cross-functional collaboration scenarios. You'll review your technical assignment with engineers, discuss architectural decisions, and demonstrate problem-solving skills through coding exercises. The cross-functional aspect involves collaboration scenarios with product managers, designers, and other stakeholders. Prepare to explain your technical choices, discuss trade-offs, handle code reviews, and demonstrate how you work in interdisciplinary teams typical of automotive technology development.",
          stage_order: 3,
          recommendedQuestionIds: analysis.stages[2]?.recommendedQuestionIds || []
        },
        {
          title: "Final Interview",
          description: "The final round focuses on leadership potential, strategic thinking, and long-term fit with Woven by Toyota's vision. Expect discussions about your career aspirations, how you handle challenges, your approach to innovation in mobility technology, and your understanding of the automotive industry's future. This stage often involves senior leadership and covers topics like mentoring, project leadership, and your potential contributions to Woven's mission of creating safer, more sustainable mobility solutions.",
          stage_order: 4,
          recommendedQuestionIds: analysis.stages[3]?.recommendedQuestionIds || []
        }
      ];
      
      analysis.stages = wovenStages;
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
