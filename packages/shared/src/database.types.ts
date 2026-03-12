export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          password: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      career_matrices: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          source: string
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          source: string
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          source?: string
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          ai_feedback: string | null
          ai_feedback_generated_at: string | null
          blocker: string | null
          check_in_date: string
          check_in_type: string
          completed_at: string | null
          created_at: string | null
          daily_goal: string | null
          energy_level: number | null
          focus_area: string | null
          goal_completed: string | null
          id: string
          input_method: string | null
          quick_win: string | null
          tomorrow_carry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_feedback_generated_at?: string | null
          blocker?: string | null
          check_in_date: string
          check_in_type: string
          completed_at?: string | null
          created_at?: string | null
          daily_goal?: string | null
          energy_level?: number | null
          focus_area?: string | null
          goal_completed?: string | null
          id?: string
          input_method?: string | null
          quick_win?: string | null
          tomorrow_carry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_feedback_generated_at?: string | null
          blocker?: string | null
          check_in_date?: string
          check_in_type?: string
          completed_at?: string | null
          created_at?: string | null
          daily_goal?: string | null
          energy_level?: number | null
          focus_area?: string | null
          goal_completed?: string | null
          id?: string
          input_method?: string | null
          quick_win?: string | null
          tomorrow_carry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          created_at: string | null
          date: string
          entries_count: number | null
          id: string
          mentor_messages: number | null
          tags_used: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          entries_count?: number | null
          id?: string
          mentor_messages?: number | null
          tags_used?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          entries_count?: number | null
          id?: string
          mentor_messages?: number | null
          tags_used?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id: string
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string | null
          id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      level_definitions: {
        Row: {
          collaboration_expectations: string[] | null
          created_at: string | null
          id: string
          leadership_expectations: string[] | null
          level_code: string
          level_name: string
          level_order: number
          matrix_id: string
          scope: Json | null
          technical_expectations: string[] | null
          visibility_expectations: string[] | null
        }
        Insert: {
          collaboration_expectations?: string[] | null
          created_at?: string | null
          id?: string
          leadership_expectations?: string[] | null
          level_code: string
          level_name: string
          level_order: number
          matrix_id: string
          scope?: Json | null
          technical_expectations?: string[] | null
          visibility_expectations?: string[] | null
        }
        Update: {
          collaboration_expectations?: string[] | null
          created_at?: string | null
          id?: string
          leadership_expectations?: string[] | null
          level_code?: string
          level_name?: string
          level_order?: number
          matrix_id?: string
          scope?: Json | null
          technical_expectations?: string[] | null
          visibility_expectations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "level_definitions_matrix_id_fkey"
            columns: ["matrix_id"]
            referencedRelation: "career_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          career_matrix_id: string | null
          company_name: string | null
          company_size: string | null
          created_at: string | null
          email: string
          focus_areas: string[] | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
          role: string | null
          target_role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          career_matrix_id?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          focus_areas?: string[] | null
          id: string
          name?: string | null
          onboarding_completed?: boolean | null
          role?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          career_matrix_id?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          focus_areas?: string[] | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          role?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_career_matrix_id_fkey"
            columns: ["career_matrix_id"]
            referencedRelation: "career_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          evening_enabled: boolean | null
          evening_time: string | null
          id: string
          last_evening_notification_at: string | null
          last_morning_notification_at: string | null
          morning_enabled: boolean | null
          morning_time: string | null
          phone_number: string | null
          push_enabled: boolean | null
          push_token: string | null
          sms_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weekly_day: string | null
          weekly_enabled: boolean | null
          weekly_time: string | null
        }
        Insert: {
          created_at?: string | null
          evening_enabled?: boolean | null
          evening_time?: string | null
          id?: string
          last_evening_notification_at?: string | null
          last_morning_notification_at?: string | null
          morning_enabled?: boolean | null
          morning_time?: string | null
          phone_number?: string | null
          push_enabled?: boolean | null
          push_token?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weekly_day?: string | null
          weekly_enabled?: boolean | null
          weekly_time?: string | null
        }
        Update: {
          created_at?: string | null
          evening_enabled?: boolean | null
          evening_time?: string | null
          id?: string
          last_evening_notification_at?: string | null
          last_morning_notification_at?: string | null
          morning_enabled?: boolean | null
          morning_time?: string | null
          phone_number?: string | null
          push_enabled?: boolean | null
          push_token?: string | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_day?: string | null
          weekly_enabled?: boolean | null
          weekly_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_check_in_date: string | null
          longest_streak: number | null
          total_check_ins: number | null
          total_evening_check_ins: number | null
          total_morning_check_ins: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number | null
          total_check_ins?: number | null
          total_evening_check_ins?: number | null
          total_morning_check_ins?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_check_in_date?: string | null
          longest_streak?: number | null
          total_check_ins?: number | null
          total_evening_check_ins?: number | null
          total_morning_check_ins?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_chat_usage: {
        Args: { p_daily_limit?: number; p_user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          remaining: number
        }[]
      }
      get_due_evening_reminders: {
        Args: never
        Returns: {
          push_token: string
          user_id: string
        }[]
      }
      get_due_morning_reminders: {
        Args: never
        Returns: {
          push_token: string
          user_id: string
        }[]
      }
      mark_evening_notifications_sent: {
        Args: { user_ids: string[] }
        Returns: undefined
      }
      mark_morning_notifications_sent: {
        Args: { user_ids: string[] }
        Returns: undefined
      }
      match_documents: {
        Args: {
          filter_user_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
