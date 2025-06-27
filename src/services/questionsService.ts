
import { supabase } from '@/integrations/supabase/client';

export interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  difficulty: string;
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

export const fetchQuestions = async (isAdmin: boolean = false): Promise<InterviewQuestion[]> => {
  try {
    console.log('📥 Fetching questions, isAdmin:', isAdmin);
    
    let query = supabase
      .from('interview_questions')
      .select('*')
      .order('created_at', { ascending: false });

    // Only filter out pending questions for non-admin users
    if (!isAdmin) {
      query = query.neq('status', 'pending');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching questions:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    console.log('✅ Questions fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Service error fetching questions:', error);
    throw error;
  }
};
