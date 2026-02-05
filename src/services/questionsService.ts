
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
  preparation_notes?: string[] | null;
  preparation_notes_generated_at?: string | null;
  preparation_notes_prompt_hash?: string | null;
  interviewer_intent?: string[] | null;
  winning_answer_framework?: WinningAnswerFramework | null;
  coaching_generated_at?: string | null;
  coaching_prompt_hash?: string | null;
}

export const fetchQuestions = async (isAdmin: boolean = false, page?: number, limit?: number): Promise<InterviewQuestion[]> => {
  try {
    let query = supabase
      .from('interview_questions')
      .select('id, question, company, role, interview_stage, category, approved_at, approved_by, additional_context, team, position_name, submitted_by, created_at, question_type, source_url, source_website, scraped_at, status, preparation_notes, preparation_notes_generated_at, preparation_notes_prompt_hash, interviewer_intent, winning_answer_framework, coaching_generated_at, coaching_prompt_hash')
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

/**
 * Get or generate preparation notes for a question (server-side generation, cached per question).
 * Call this when question.preparation_notes is missing or empty; returns existing notes or triggers generation.
 */
export const getOrGeneratePreparationNotes = async (questionId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke<{
      preparation_notes?: string[];
      error?: string;
    }>('generate-prep-notes', {
      body: { question_id: questionId },
    });

    if (error) {
      console.warn('getOrGeneratePreparationNotes error:', error);
      return [];
    }
    const notes = data?.preparation_notes;
    return Array.isArray(notes) ? notes : [];
  } catch (err) {
    console.warn('getOrGeneratePreparationNotes failed:', err);
    return [];
  }
};

export interface QuestionCoaching {
  interviewer_intent: string[];
  winning_answer_framework: WinningAnswerFramework | null;
}

/**
 * Get or generate interviewer intent and STAR winning answer framework (server-side, cached per question).
 */
export const getOrGenerateQuestionCoaching = async (
  questionId: string
): Promise<QuestionCoaching> => {
  try {
    const { data, error } = await supabase.functions.invoke<{
      interviewer_intent?: string[];
      winning_answer_framework?: WinningAnswerFramework | null;
      error?: string;
    }>('generate-question-coaching', {
      body: { question_id: questionId },
    });

    if (error) {
      console.warn('getOrGenerateQuestionCoaching error:', error);
      return { interviewer_intent: [], winning_answer_framework: null };
    }
    return {
      interviewer_intent: Array.isArray(data?.interviewer_intent) ? data.interviewer_intent : [],
      winning_answer_framework: data?.winning_answer_framework ?? null,
    };
  } catch (err) {
    console.warn('getOrGenerateQuestionCoaching failed:', err);
    return { interviewer_intent: [], winning_answer_framework: null };
  }
};
