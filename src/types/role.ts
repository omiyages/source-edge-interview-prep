export type WorkingStyle = 'Hybrid' | 'Remote' | 'Onsite';
export type RoleStatus = 'active' | 'closed' | 'draft';
export type JapaneseLevel = 'None' | 'Conversational' | 'Business' | 'Native';

export interface Role {
  id: string;
  slug: string | null;
  job_title: string;
  job_title_ja?: string | null;
  role_type: string | null;
  company: string;
  location: string;
  location_ja?: string | null;
  working_style: WorkingStyle;
  japanese_level: JapaneseLevel | null;
  division: string | null;
  job_description: string | null;
  job_description_ja?: string | null;
  commitment_ja?: string | null;
  requirements: string | null;
  nice_to_haves: string | null;
  benefits: string | null;
  status: RoleStatus;
  created_by: string | null;
  ai_summary: string | null;
  content_hash: string | null;
  ats_platform?: string | null;
  ats_external_id?: string | null;
  ats_hosted_url?: string | null;
  first_seen_at?: string;
  last_seen_at?: string;
  translation_status?: 'pending' | 'done' | 'error' | 'skipped';
  translated_at?: string | null;
  translation_error?: string | null;
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

  ats_platform?: string | null;
  ats_external_id?: string | null;
  ats_hosted_url?: string | null;

  job_title_ja?: string | null;
  job_description_ja?: string | null;
  location_ja?: string | null;
  commitment_ja?: string | null;

  translation_status?: 'pending' | 'done' | 'error' | 'skipped';
}
