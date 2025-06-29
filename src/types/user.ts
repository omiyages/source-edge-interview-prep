
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  last_login_at: string | null;
  total_session_time_minutes: number | null;
  is_active: boolean | null;
  created_at: string;
}
