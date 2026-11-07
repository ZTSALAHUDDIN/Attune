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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      learning_preferences: {
        Row: {
          break_minutes: number
          camera_enabled: boolean
          daily_goal_minutes: number
          dark_mode: boolean
          focus_minutes: number
          motivation: string
          study_technique: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_minutes?: number
          camera_enabled?: boolean
          daily_goal_minutes?: number
          dark_mode?: boolean
          focus_minutes?: number
          motivation?: string
          study_technique?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          break_minutes?: number
          camera_enabled?: boolean
          daily_goal_minutes?: number
          dark_mode?: boolean
          focus_minutes?: number
          motivation?: string
          study_technique?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          emotion_counts: Json
          ended_at: string | null
          id: string
          last_position_seconds: number
          notes: string
          quiz_score: number | null
          quiz_total: number | null
          timed_notes: Json
          transcript: string
          user_id: string
          video_id: string | null
          video_title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          emotion_counts?: Json
          ended_at?: string | null
          id?: string
          last_position_seconds?: number
          notes?: string
          quiz_score?: number | null
          quiz_total?: number | null
          timed_notes?: Json
          transcript?: string
          user_id?: string
          video_id?: string | null
          video_title?: string
          video_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          emotion_counts?: Json
          ended_at?: string | null
          id?: string
          last_position_seconds?: number
          notes?: string
          quiz_score?: number | null
          quiz_total?: number | null
          timed_notes?: Json
          transcript?: string
          user_id?: string
          video_id?: string | null
          video_title?: string
          video_url?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          attempt_id: string | null
          correct_answer: string
          created_at: string
          explanation: string
          id: string
          is_correct: boolean
          question: string
          selected_answer: string
          topic: string
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          correct_answer: string
          created_at?: string
          explanation?: string
          id?: string
          is_correct: boolean
          question: string
          selected_answer?: string
          topic: string
          user_id?: string
        }
        Update: {
          attempt_id?: string | null
          correct_answer?: string
          created_at?: string
          explanation?: string
          id?: string
          is_correct?: boolean
          question?: string
          selected_answer?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          score: number
          session_id: string | null
          total: number
          user_id: string
          video_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          score: number
          session_id?: string | null
          total: number
          user_id?: string
          video_title?: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          session_id?: string | null
          total?: number
          user_id?: string
          video_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cards: {
        Row: {
          back: string
          created_at: string
          due_at: string
          ease: number
          front: string
          id: string
          interval_days: number
          lapses: number
          last_reviewed_at: string | null
          repetitions: number
          topic: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          due_at?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          repetitions?: number
          topic: string
          user_id?: string
        }
        Update: {
          back?: string
          created_at?: string
          due_at?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          repetitions?: number
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
