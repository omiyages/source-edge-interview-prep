
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
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

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}
