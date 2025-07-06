
import { supabase } from '@/integrations/supabase/client';

export interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  approved_at: string | null;
  approved_by: string | null;
  additional_context: string | null;
  team: string | null;
  position_name: string | null;
  submitted_by: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
}

export const fetchQuestions = async (isAdmin: boolean = false, page?: number, limit?: number): Promise<InterviewQuestion[]> => {
  try {
    let query = supabase
      .from('interview_questions')
      .select('id, question, company, role, interview_stage, category, approved_at, approved_by, additional_context, team, position_name, submitted_by, created_at, question_type, source_url, source_website, scraped_at')
      .order('created_at', { ascending: false });

    // Only filter out pending questions for non-admin users
    if (!isAdmin) {
      query = query.neq('status', 'pending');
    }

    // Add pagination if specified
    if (page !== undefined && limit !== undefined) {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('❌ Service error fetching questions:', error);
    throw error;
  }
};
