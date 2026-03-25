
// ABOUTME: Aggregates analytics data from existing Supabase tables for the admin dashboard
// ABOUTME: Uses clerkSupabaseClient so RLS admin policies are satisfied

import { useQuery } from '@tanstack/react-query';
import { clerkSupabaseClient } from '@/lib/clerk';

const getMonthBuckets = (count: number) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const end = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i) + 1, 1);
    const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });
    return { start, end, label };
  });
};

export const useAdminAnalytics = () => {
  const usersQuery = useQuery({
    queryKey: ['analytics-users'],
    queryFn: async () => {
      const { data, error } = await clerkSupabaseClient
        .from('profiles')
        .select('id, is_active, role, created_at, last_login_at');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const questionsQuery = useQuery({
    queryKey: ['analytics-questions'],
    queryFn: async () => {
      const { data, error } = await clerkSupabaseClient
        .from('interview_questions')
        .select('id, status, created_at');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const assignmentsQuery = useQuery({
    queryKey: ['analytics-assignments'],
    queryFn: async () => {
      const { data, error } = await clerkSupabaseClient
        .from('course_assignments')
        .select('id, assigned_at');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const users = usersQuery.data ?? [];
  const questions = questionsQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    users: {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      pending: users.filter((u) => !u.is_active).length,
      newThisMonth: users.filter((u) => new Date(u.created_at) >= startOfMonth).length,
      admins: users.filter((u) => u.role === 'admin').length,
    },
    questions: {
      total: questions.length,
      pending: questions.filter((q) => q.status === 'pending').length,
      approved: questions.filter((q) => q.status === 'approved').length,
      rejected: questions.filter((q) => q.status === 'rejected').length,
      newThisMonth: questions.filter((q) => new Date(q.created_at) >= startOfMonth).length,
    },
    courses: {
      totalAssignments: assignments.length,
      newThisMonth: assignments.filter((a) => new Date(a.assigned_at) >= startOfMonth).length,
    },
  };

  const buckets = getMonthBuckets(6);

  const monthlyRegistrations = buckets.map(({ start, end, label }) => ({
    month: label,
    users: users.filter((u) => {
      const d = new Date(u.created_at);
      return d >= start && d < end;
    }).length,
  }));

  const monthlyQuestions = buckets.map(({ start, end, label }) => ({
    month: label,
    questions: questions.filter((q) => {
      const d = new Date(q.created_at);
      return d >= start && d < end;
    }).length,
  }));

  // Active users = logged in within last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentlyActive = users.filter(
    (u) => u.last_login_at && new Date(u.last_login_at) >= thirtyDaysAgo,
  ).length;

  return {
    stats,
    recentlyActive,
    monthlyRegistrations,
    monthlyQuestions,
    isLoading: usersQuery.isLoading || questionsQuery.isLoading || assignmentsQuery.isLoading,
    error: usersQuery.error || questionsQuery.error || assignmentsQuery.error,
  };
};
