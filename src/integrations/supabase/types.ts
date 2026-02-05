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
          recommended: boolean | null
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
          recommended?: boolean | null
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
          recommended?: boolean | null
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
      stage_summaries: {
        Row: {
          id: string
          stage_id: string
          tldr_points: Json
          testing_focus_quote: string | null
          testing_focus_points: Json
          common_pitfalls: Json
          content_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stage_id: string
          tldr_points?: Json
          testing_focus_quote?: string | null
          testing_focus_points?: Json
          common_pitfalls?: Json
          content_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stage_id?: string
          tldr_points?: Json
          testing_focus_quote?: string | null
          testing_focus_points?: Json
          common_pitfalls?: Json
          content_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_summaries_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: true
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
      stage_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          information: string | null
          name: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          information?: string | null
          name: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          information?: string | null
          name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      check_enhanced_rate_limit: {
        Args: {
          max_attempts?: number
          operation_name: string
          window_minutes?: number
        }
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
      enable_secure_profile_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enhanced_check_role_change_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_profiles_secure: {
        Args: {
          include_sensitive_fields?: boolean
          requesting_user_role?: string
          target_user_ids?: string[]
        }
        Returns: {
          created_at: string
          current_company: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string
          linkedin_profile: string
          masked_salary_range: string
          role: string
          skillsets: string[]
          total_session_time_minutes: number
          years_of_experience: number
        }[]
      }
      get_secure_profile: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          current_company: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          linkedin_profile: string
          role: string
          salary_info: Json
          skillsets: string[]
          years_of_experience: number
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
      mask_sensitive_profile_data: {
        Args: {
          is_own_profile?: boolean
          profile_data: Json
          requesting_user_role: string
        }
        Returns: Json
      }
      update_profile_secure: {
        Args: { profile_updates: Json; target_user_id: string }
        Returns: Json
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
      validate_question_input: {
        Args: {
          additional_context?: string
          company_name: string
          question_text: string
          role_name: string
        }
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
