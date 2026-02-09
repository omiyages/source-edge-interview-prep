
// ABOUTME: Question permissions utility to fix delete permission issues
// ABOUTME: Addresses EXPOSED_SENSITIVE_DATA in question management

import { supabase } from '@/integrations/supabase/client';

export const checkQuestionDeletePermission = async (questionId: string, userEmail: string, isAdmin: boolean): Promise<boolean> => {
  // Admins can delete any question
  if (isAdmin) {
    return true;
  }

  try {
    // Non-admin users can only delete their own questions
    const { data: question, error } = await supabase
      .from('interview_questions')
      .select('submitted_by, question_type')
      .eq('id', questionId)
      .single();

    if (error) {
      return false;
    }

    // Users can only delete their own submitted questions
    return question?.submitted_by === userEmail && question?.question_type === 'user_submitted';
  } catch (error) {
    return false;
  }
};

export const checkQuestionEditPermission = async (questionId: string, userEmail: string, isAdmin: boolean): Promise<boolean> => {
  // Admins can edit any question
  if (isAdmin) {
    return true;
  }

  try {
    const { data: question, error } = await supabase
      .from('interview_questions')
      .select('submitted_by, status')
      .eq('id', questionId)
      .single();

    if (error) return false;

    // Users can only edit their own pending questions
    return question?.submitted_by === userEmail && question?.status === 'pending';
  } catch (error) {
    return false;
  }
};
