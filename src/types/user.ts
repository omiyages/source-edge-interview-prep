
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  last_login_at: string | null;
  total_session_time_minutes: number | null;
  is_active: boolean | null;
  created_at: string;
  linkedin_profile?: string | null;
  current_company?: string | null;
  years_of_experience?: number | null;
  past_companies?: string[] | null;
  skillsets?: string[] | null;
  notes?: string[] | null;
  phone_number?: string | null;
  salary?: number | null;
  // Add optional properties for backward compatibility
  updated_at?: string;
  is_user?: boolean;
  general_notes?: string | null;
}
