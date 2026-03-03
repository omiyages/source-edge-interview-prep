
// ABOUTME: Service for fetching and managing interview questions from the database
// ABOUTME: Handles question retrieval with admin/user filtering and pagination support

import { supabase } from '@/integrations/supabase/client';

export interface WinningAnswerFramework {
  situation: string;
  task: string;
  action: string[];
  result: string;
}

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
  status: string;
  preparation_notes?: string[];
  interviewer_intent?: string[];
  winning_answer_framework?: WinningAnswerFramework;
}

export const fetchQuestions = async (
  isAdmin: boolean = false,
  page?: number,
  limit?: number
): Promise<InterviewQuestion[]> => {
  try {
    // Lightweight payload for list pages; detail dialog lazy-loads AI fields on demand.
    let query = supabase
      .from('interview_questions')
      .select('id, question, company, role, interview_stage, category, approved_at, approved_by, additional_context, team, position_name, submitted_by, created_at, question_type, source_url, source_website, scraped_at, status')
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

export interface PaginatedQuestionsParams {
  isAdmin?: boolean;
  page: number;
  limit: number;
  search?: string;
  company?: string[];
  category?: string[];
  role?: string[];
  stage?: string[];
  sortBy?: 'popularity' | 'newest' | 'oldest';
}

export interface PaginatedQuestionsResult {
  data: InterviewQuestion[];
  totalCount: number;
}

function applyQuestionFilters(
  query: any,
  params: Omit<PaginatedQuestionsParams, 'page' | 'limit'>
) {
  const { isAdmin = false, search, company, category, role, stage } = params;

  if (!isAdmin) {
    query = query.neq('status', 'pending');
  }

  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(
      `question.ilike.%${s}%,company.ilike.%${s}%,role.ilike.%${s}%,category.ilike.%${s}%,interview_stage.ilike.%${s}%`
    );
  }

  if (company && company.length > 0) query = query.in('company', company);
  if (category && category.length > 0) query = query.in('category', category);
  if (role && role.length > 0) query = query.in('role', role);
  if (stage && stage.length > 0) query = query.in('interview_stage', stage);

  return query;
}

export const fetchPaginatedQuestions = async (
  params: PaginatedQuestionsParams
): Promise<InterviewQuestion[]> => {
  try {
    const { isAdmin = false, page, limit, search, company, category, role, stage, sortBy = 'popularity' } = params;

    // Lightweight list payload for faster page loads.
    let query = supabase
      .from('interview_questions')
      .select('id, question, company, role, interview_stage, category, approved_at, approved_by, additional_context, team, position_name, submitted_by, created_at, question_type, source_url, source_website, scraped_at, status');

    query = applyQuestionFilters(query, { isAdmin, search, company, category, role, stage, sortBy });

    // Sort
    const ascending = sortBy === 'oldest';
    query = query.order('created_at', { ascending });

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return (data || []) as InterviewQuestion[];
  } catch (error) {
    console.error('❌ Service error fetching paginated questions:', error);
    throw error;
  }
};

export const fetchPaginatedQuestionsCount = async (
  params: Omit<PaginatedQuestionsParams, 'page' | 'limit' | 'sortBy'>
): Promise<number> => {
  try {
    const { isAdmin = false, search, company, category, role, stage } = params;

    let query = supabase
      .from('interview_questions')
      .select('id', { count: 'exact', head: true });

    query = applyQuestionFilters(query, { isAdmin, search, company, category, role, stage });

    const { count, error } = await query;
    if (error) throw new Error(`Failed to fetch question count: ${error.message}`);

    return count || 0;
  } catch (error) {
    console.error('❌ Service error fetching question count:', error);
    throw error;
  }
};

export const getOrGeneratePreparationNotes = async (questionId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-prep-notes', {
      body: { question_id: questionId },
    });
    if (error) throw error;
    return data?.preparation_notes || [];
  } catch (error) {
    console.error('❌ Error generating preparation notes:', error);
    return [];
  }
};

export interface QuestionStats {
  total_count: number;
  companies: { company: string; count: number }[] | null;
  roles: { role: string; count: number }[] | null;
  stages: { stage: string; count: number }[] | null;
  categories: string[] | null;
}

export const fetchQuestionStats = async (): Promise<QuestionStats> => {
  try {
    const { data, error } = await supabase.rpc('get_question_stats');
    if (error) throw error;
    return data as QuestionStats;
  } catch (error) {
    console.error('❌ Error fetching question stats:', error);
    return { total_count: 0, companies: null, roles: null, stages: null, categories: null };
  }
};

export const getOrGenerateQuestionCoaching = async (
  questionId: string
): Promise<{ interviewer_intent: string[]; winning_answer_framework: WinningAnswerFramework }> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-question-coaching', {
      body: { question_id: questionId },
    });
    if (error) throw error;
    return {
      interviewer_intent: data?.interviewer_intent || [],
      winning_answer_framework: data?.winning_answer_framework || null,
    };
  } catch (error) {
    console.error('❌ Error generating question coaching:', error);
    return { interviewer_intent: [], winning_answer_framework: { situation: '', task: '', action: [], result: '' } };
  }
};
