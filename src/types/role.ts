export type WorkingStyle = 'Hybrid' | 'Remote' | 'Onsite';
export type RoleStatus = 'active' | 'closed' | 'draft';
export type JapaneseLevel = 'None' | 'Conversational' | 'Business' | 'Native';

export interface Role {
  id: string;
  slug: string | null;
  job_title: string;
  role_type: string | null;
  company: string;
  location: string;
  working_style: WorkingStyle;
  japanese_level: JapaneseLevel | null;
  division: string | null;
  job_description: string | null;
  requirements: string | null;
  nice_to_haves: string | null;
  benefits: string | null;
  status: RoleStatus;
  created_by: string | null;
  ai_summary: string | null;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleFormData {
  job_title: string;
  role_type: string;
  company: string;
  location: string;
  working_style: WorkingStyle;
  japanese_level: JapaneseLevel;
  division: string;
  job_description: string;
  requirements: string;
  nice_to_haves: string;
  benefits: string;
  status: RoleStatus;
}
