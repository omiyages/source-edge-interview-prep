
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, source_website } = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Simple web scraping (you can enhance this with more sophisticated scraping)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()
    
    // Basic pattern matching for interview questions
    // This is a simplified example - you'd want more sophisticated parsing
    const questionPatterns = [
      /(?:Q:|Question:|Interview question:)\s*([^?]+\?)/gi,
      /(?:They asked me|I was asked|The question was):\s*"([^"]+)"/gi,
      /(?:Technical question|Coding question):\s*([^\.]+\.)/gi
    ]

    const questions = []
    
    for (const pattern of questionPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null && questions.length < 10) {
        const question = match[1].trim()
        if (question.length > 10 && question.length < 500) {
          questions.push({
            question: question,
            company: extractCompanyFromUrl(url) || 'Unknown',
            role: 'Software Engineer', // Default, could be enhanced
            difficulty: 'Medium',
            interview_stage: 'Technical',
            category: 'Technical',
            question_type: 'online_sourced',
            source_url: url,
            source_website: source_website || extractDomainFromUrl(url),
            scraped_at: new Date().toISOString(),
            submitted_by: 'Web Scraper'
          })
        }
      }
    }

    // Insert questions into database
    if (questions.length > 0) {
      const { data, error } = await supabase
        .from('interview_questions')
        .insert(questions)
        .select()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ 
          message: `Successfully scraped ${questions.length} questions`,
          questions: data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ message: 'No questions found at the provided URL' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function extractCompanyFromUrl(url: string): string | null {
  const patterns = [
    /glassdoor\.com\/.*\/([^\/]+)-interview/i,
    /leetcode\.com\/company\/([^\/]+)/i,
    /interviews\.(\w+)/i
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }
  
  return null
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'Unknown'
  }
}
