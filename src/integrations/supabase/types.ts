export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      candidate_pipeline: {
        Row: {
          applied_company: string | null
          applied_job_title: string | null
          candidate_id: string | null
          candidate_ref_id: string | null
          created_at: string
          id: string
          is_active: boolean
          moved_at: string
          moved_by: string | null
          notes: string | null
          sheet_row_id: string | null
          stage_id: string
          updated_at: string | null
        }
        Insert: {
          applied_company?: string | null
          applied_job_title?: string | null
          candidate_id?: string | null
          candidate_ref_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          moved_at?: string
          moved_by?: string | null
          notes?: string | null
          sheet_row_id?: string | null
          stage_id: string
          updated_at?: string | null
        }
        Update: {
          applied_company?: string | null
          applied_job_title?: string | null
          candidate_id?: string | null
          candidate_ref_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          moved_at?: string
          moved_by?: string | null
          notes?: string | null
          sheet_row_id?: string | null
          stage_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_pipeline_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_pipeline_candidate_ref_id_fkey"
            columns: ["candidate_ref_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_pipeline_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_pipeline_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          current_company: string | null
          email: string | null
          full_name: string | null
          general_notes: string | null
          id: string
          is_active: boolean | null
          is_user: boolean
          linkedin_profile: string | null
          past_companies: string[] | null
          phone_number: string | null
          salary: number | null
          skillsets: string[] | null
          updated_at: string
          user_id: string | null
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string
          current_company?: string | null
          email?: string | null
          full_name?: string | null
          general_notes?: string | null
          id?: string
          is_active?: boolean | null
          is_user?: boolean
          linkedin_profile?: string | null
          past_companies?: string[] | null
          phone_number?: string | null
          salary?: number | null
          skillsets?: string[] | null
          updated_at?: string
          user_id?: string | null
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string
          current_company?: string | null
          email?: string | null
          full_name?: string | null
          general_notes?: string | null
          id?: string
          is_active?: boolean | null
          is_user?: boolean
          linkedin_profile?: string | null
          past_companies?: string[] | null
          phone_number?: string | null
          salary?: number | null
          skillsets?: string[] | null
          updated_at?: string
          user_id?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          improvement_suggestions: string | null
          read_at: string | null
          read_by: string | null
          read_status: boolean
          stage_ratings: Json
          support_feedback: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          improvement_suggestions?: string | null
          read_at?: string | null
          read_by?: string | null
          read_status?: boolean
          stage_ratings?: Json
          support_feedback?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          improvement_suggestions?: string | null
          read_at?: string | null
          read_by?: string | null
          read_status?: boolean
          stage_ratings?: Json
          support_feedback?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_stages: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          information: string | null
          stage_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          information?: string | null
          stage_order: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          information?: string | null
          stage_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_stages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          attached_jobs: string[] | null
          company: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          attached_jobs?: string[] | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          attached_jobs?: string[] | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dropdown_options: {
        Row: {
          created_at: string
          created_by: string | null
          field_name: string
          id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_name: string
          id?: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_name?: string
          id?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      enhanced_security_events: {
        Row: {
          action_attempted: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_accessed: string | null
          risk_level: string | null
          success: boolean
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_attempted?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_accessed?: string | null
          risk_level?: string | null
          success?: boolean
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_attempted?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_accessed?: string | null
          risk_level?: string | null
          success?: boolean
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      google_sheets_candidate_imports: {
        Row: {
          candidate_id: string | null
          id: string
          import_data: Json | null
          imported_at: string
          integration_id: string | null
          sheet_row_number: number | null
        }
        Insert: {
          candidate_id?: string | null
          id?: string
          import_data?: Json | null
          imported_at?: string
          integration_id?: string | null
          sheet_row_number?: number | null
        }
        Update: {
          candidate_id?: string | null
          id?: string
          import_data?: Json | null
          imported_at?: string
          integration_id?: string | null
          sheet_row_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "google_sheets_candidate_imports_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_sheets_candidate_imports_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_sheets_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sheets_integrations: {
        Row: {
          access_token: string | null
          column_mappings: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          range_specification: string | null
          sheet_id: string
          sheet_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          column_mappings?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          range_specification?: string | null
          sheet_id: string
          sheet_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          column_mappings?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          range_specification?: string | null
          sheet_id?: string
          sheet_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hiring_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          order_index: number
          stage_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          order_index: number
          stage_order: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          stage_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      interview_questions: {
        Row: {
          additional_context: string | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          company: string
          created_at: string
          id: string
          interview_stage: string | null
          position_name: string | null
          question: string
          question_type: string | null
          role: string
          scraped_at: string | null
          source_url: string | null
          source_website: string | null
          status: string | null
          submitted_by: string | null
          team: string | null
          updated_at: string
        }
        Insert: {
          additional_context?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company: string
          created_at?: string
          id?: string
          interview_stage?: string | null
          position_name?: string | null
          question: string
          question_type?: string | null
          role: string
          scraped_at?: string | null
          source_url?: string | null
          source_website?: string | null
          status?: string | null
          submitted_by?: string | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          additional_context?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company?: string
          created_at?: string
          id?: string
          interview_stage?: string | null
          position_name?: string | null
          question?: string
          question_type?: string | null
          role?: string
          scraped_at?: string | null
          source_url?: string | null
          source_website?: string | null
          status?: string | null
          submitted_by?: string | null
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          current_company: string | null
          email: string
          full_name: string | null
          general_notes: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          linkedin_profile: string | null
          notes: string[] | null
          past_companies: string[] | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          salary: number | null
          skillsets: string[] | null
          total_session_time_minutes: number | null
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          email: string
          full_name?: string | null
          general_notes?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          linkedin_profile?: string | null
          notes?: string[] | null
          past_companies?: string[] | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salary?: number | null
          skillsets?: string[] | null
          total_session_time_minutes?: number | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          email?: string
          full_name?: string | null
          general_notes?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          linkedin_profile?: string | null
          notes?: string[] | null
          past_companies?: string[] | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salary?: number | null
          skillsets?: string[] | null
          total_session_time_minutes?: number | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      question_likes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stage_questions: {
        Row: {
          created_at: string
          id: string
          question_id: string
          stage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          stage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_questions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "course_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_resources: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          stage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          stage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_resources_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "course_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string
          course_id: string
          created_at: string
          id: string
          stage_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          created_at?: string
          id?: string
          stage_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          created_at?: string
          id?: string
          stage_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "course_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      block_direct_token_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          max_attempts?: number
          operation_name: string
          window_minutes?: number
        }
        Returns: boolean
      }
      encrypt_access_token: {
        Args: { plain_token: string }
        Returns: string
      }
      encrypt_token: {
        Args: { token: string }
        Returns: string
      }
      enhanced_check_role_change_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_safe_integration_data: {
        Args: { integration_id: string }
        Returns: {
          column_mappings: Json
          created_at: string
          has_token: boolean
          id: string
          is_active: boolean
          last_sync_at: string
          range_specification: string
          sheet_id: string
          sheet_name: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_integrations: {
        Args: Record<PropertyKey, never>
        Returns: {
          column_mappings: Json
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string
          range_specification: string
          sheet_id: string
          sheet_name: string
          token_status: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action_attempted?: string
          p_event_type: string
          p_metadata?: Json
          p_resource_accessed?: string
          p_risk_level?: string
          p_success?: boolean
          p_user_email?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      monitor_oauth_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          security_summary: Json
        }[]
      }
      secure_google_api_proxy: {
        Args: {
          api_endpoint: string
          http_method?: string
          integration_id: string
          request_body?: Json
        }
        Returns: Json
      }
      update_integration_token: {
        Args: { integration_id: string; new_token: string }
        Returns: boolean
      }
      update_user_role_with_audit: {
        Args: {
          new_role: string
          reason?: string
          target_user_id: string
          user_agent?: string
        }
        Returns: Json
      }
      validate_google_token_status: {
        Args: { integration_id: string }
        Returns: Json
      }
      validate_token_access: {
        Args: { integration_id: string }
        Returns: boolean
      }
      validate_token_ownership: {
        Args: { integration_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
    },
  },
} as const
