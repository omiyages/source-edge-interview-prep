import type { MinimalUser } from '@/hooks/useAuthContext';

export type { MinimalUser };

export interface Profile {
  id: string;  // Clerk user ID (e.g. "user_2abc") — same as profiles.id in DB
  email: string;
  role: 'user' | 'admin';
  full_name?: string;
  last_login_at?: string;
  total_session_time_minutes?: number;
  created_by?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
