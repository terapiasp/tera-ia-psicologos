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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      frequency_presets: {
        Row: {
          created_at: string
          estimated_sessions_per_month: number
          id: string
          is_active: boolean
          name: string
          recurrence_pattern: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_sessions_per_month?: number
          id?: string
          is_active?: boolean
          name: string
          recurrence_pattern: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_sessions_per_month?: number
          id?: string
          is_active?: boolean
          name?: string
          recurrence_pattern?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          patient_id: string
          session_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          patient_id: string
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          patient_id?: string
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          archived_at: string | null
          birth_date: string | null
          created_at: string
          custom_frequency: string | null
          email: string | null
          external_session_link: string | null
          frequency: string
          frequency_preset_id: string | null
          id: string
          is_archived: boolean
          link_created_at: string | null
          link_last_used: string | null
          link_type: string | null
          name: string
          nickname: string | null
          payment_day: number | null
          payment_period_sessions: number | null
          payment_scheme: string | null
          phone: string | null
          recurring_meet_code: string | null
          service_modality_id: string | null
          session_duration: number | null
          session_link: string | null
          session_mode: string
          session_value: number | null
          status: string
          therapy_type: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          birth_date?: string | null
          created_at?: string
          custom_frequency?: string | null
          email?: string | null
          external_session_link?: string | null
          frequency?: string
          frequency_preset_id?: string | null
          id?: string
          is_archived?: boolean
          link_created_at?: string | null
          link_last_used?: string | null
          link_type?: string | null
          name: string
          nickname?: string | null
          payment_day?: number | null
          payment_period_sessions?: number | null
          payment_scheme?: string | null
          phone?: string | null
          recurring_meet_code?: string | null
          service_modality_id?: string | null
          session_duration?: number | null
          session_link?: string | null
          session_mode?: string
          session_value?: number | null
          status?: string
          therapy_type?: string
          updated_at?: string
          user_id: string
          whatsapp?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          birth_date?: string | null
          created_at?: string
          custom_frequency?: string | null
          email?: string | null
          external_session_link?: string | null
          frequency?: string
          frequency_preset_id?: string | null
          id?: string
          is_archived?: boolean
          link_created_at?: string | null
          link_last_used?: string | null
          link_type?: string | null
          name?: string
          nickname?: string | null
          payment_day?: number | null
          payment_period_sessions?: number | null
          payment_scheme?: string | null
          phone?: string | null
          recurring_meet_code?: string | null
          service_modality_id?: string | null
          session_duration?: number | null
          session_link?: string | null
          session_mode?: string
          session_value?: number | null
          status?: string
          therapy_type?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_service_modality_id_fkey"
            columns: ["service_modality_id"]
            isOneToOne: false
            referencedRelation: "service_modalities"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transfers: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          patient_id: string | null
          receiver_bank: string | null
          receiver_name: string | null
          reference: string | null
          sender_bank: string | null
          sender_name: string | null
          transfer_date: string
          updated_at: string
          user_id: string
          validation_method: string | null
          validation_notes: string | null
          validation_status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string | null
          receiver_bank?: string | null
          receiver_name?: string | null
          reference?: string | null
          sender_bank?: string | null
          sender_name?: string | null
          transfer_date: string
          updated_at?: string
          user_id: string
          validation_method?: string | null
          validation_notes?: string | null
          validation_status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string | null
          receiver_bank?: string | null
          receiver_name?: string | null
          reference?: string | null
          sender_bank?: string | null
          sender_name?: string | null
          transfer_date?: string
          updated_at?: string
          user_id?: string
          validation_method?: string | null
          validation_notes?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transfers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          clinic_name: string | null
          country: string | null
          created_at: string
          crp_number: string | null
          default_payment_day: number | null
          default_payment_period_sessions: number | null
          default_payment_scheme: string | null
          email: string
          id: string
          metadata: Json
          name: string
          onboarding_completed: boolean | null
          parametro_cobranca: number | null
          phone: string | null
          pix_copy_paste: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          pix_qr_code: string | null
          pix_updated_at: string | null
          state: string | null
          template_lembrete_pagamento: string | null
          template_lembrete_sessao: string | null
          timezone: string | null
          tipo_cobranca: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clinic_name?: string | null
          country?: string | null
          created_at?: string
          crp_number?: string | null
          default_payment_day?: number | null
          default_payment_period_sessions?: number | null
          default_payment_scheme?: string | null
          email: string
          id?: string
          metadata?: Json
          name: string
          onboarding_completed?: boolean | null
          parametro_cobranca?: number | null
          phone?: string | null
          pix_copy_paste?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          pix_qr_code?: string | null
          pix_updated_at?: string | null
          state?: string | null
          template_lembrete_pagamento?: string | null
          template_lembrete_sessao?: string | null
          timezone?: string | null
          tipo_cobranca?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clinic_name?: string | null
          country?: string | null
          created_at?: string
          crp_number?: string | null
          default_payment_day?: number | null
          default_payment_period_sessions?: number | null
          default_payment_scheme?: string | null
          email?: string
          id?: string
          metadata?: Json
          name?: string
          onboarding_completed?: boolean | null
          parametro_cobranca?: number | null
          phone?: string | null
          pix_copy_paste?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          pix_qr_code?: string | null
          pix_updated_at?: string | null
          state?: string | null
          template_lembrete_pagamento?: string | null
          template_lembrete_sessao?: string | null
          timezone?: string | null
          tipo_cobranca?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_exceptions: {
        Row: {
          created_at: string
          exception_date: string
          exception_type: string
          id: string
          new_datetime: string | null
          schedule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exception_date: string
          exception_type: string
          id?: string
          new_datetime?: string | null
          schedule_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exception_date?: string
          exception_type?: string
          id?: string
          new_datetime?: string | null
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_exceptions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "recurring_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedules: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean
          patient_id: string
          rrule_json: Json
          session_type: string
          session_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          patient_id: string
          rrule_json: Json
          session_type?: string
          session_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          patient_id?: string
          rrule_json?: Json
          session_type?: string
          session_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_modalities: {
        Row: {
          commission_percentage: number | null
          commission_type: string | null
          commission_value: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          session_value: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_percentage?: number | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          session_value?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_percentage?: number | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          session_value?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          modality: string | null
          notes: string | null
          origin: string
          paid: boolean
          patient_id: string
          schedule_id: string | null
          scheduled_at: string
          status: string
          type: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          modality?: string | null
          notes?: string | null
          origin?: string
          paid?: boolean
          patient_id: string
          schedule_id?: string | null
          scheduled_at: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          modality?: string | null
          notes?: string | null
          origin?: string
          paid?: boolean
          patient_id?: string
          schedule_id?: string | null
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "recurring_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_terapia_sp_modality: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_daily_sessions_for_notifications: {
        Args: { target_date?: string }
        Returns: {
          consolidated_status: string
          duration_minutes: number
          patient_name: string
          payment_status: string
          psychologist_name: string
          psychologist_phone: string
          scheduled_at: string
          scheduled_at_formatted: string
          session_id: string
          session_status: string
          session_value: number
          template_lembrete_sessao: string
          timezone: string
        }[]
      }
      get_link_status: {
        Args: { patient_row: Database["public"]["Tables"]["patients"]["Row"] }
        Returns: string
      }
      get_next_day_sessions_for_patient_notifications: {
        Args: { target_date?: string }
        Returns: {
          clinic_name: string
          consolidated_status: string
          duration_minutes: number
          patient_name: string
          patient_phone: string
          patient_whatsapp: string
          payment_status: string
          psychologist_crp: string
          psychologist_name: string
          psychologist_whatsapp: string
          scheduled_at: string
          scheduled_at_formatted: string
          session_id: string
          session_link: string
          session_status: string
          session_value: number
          template_lembrete_sessao: string
          timezone: string
        }[]
      }
      get_patients_with_missing_sessions: {
        Args: { target_user_id: string }
        Returns: {
          patient_id: string
          patient_name: string
          schedule_id: string
        }[]
      }
      get_session_link_resolved: {
        Args: { patient_row: Database["public"]["Tables"]["patients"]["Row"] }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "psychologist"
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
      app_role: ["super_admin", "psychologist"],
    },
  },
} as const
