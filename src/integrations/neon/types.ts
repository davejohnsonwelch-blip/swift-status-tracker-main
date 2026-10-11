export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      transfer_timeline_events: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          status: string
          step_name: string
          step_order: number
          transfer_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          step_name: string
          step_order: number
          transfer_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          step_name?: string
          step_order?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_timeline_events_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          account_name: string | null
          account_number: string | null
          admin_notes: string | null
          amount: number
          fee_amount: number | null
          fee_btc_address: string | null
          fee_note: string | null
          fee_paid: boolean | null
          fee_paid_at: string | null
          bank_country: string | null
          bank_name: string | null
          created_at: string
          created_by: string | null
          crypto_type: string | null
          currency: string
          id: string
          method: string
          network: string | null
          public_id: string
          recipient_name: string
          sender_name: string
          sender_reference: string | null
          status: string
          transaction_hash: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          amount: number
          fee_amount?: number | null
          fee_btc_address?: string | null
          fee_note?: string | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          bank_country?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          crypto_type?: string | null
          currency?: string
          id?: string
          method: string
          network?: string | null
          public_id?: string
          recipient_name: string
          sender_name: string
          sender_reference?: string | null
          status?: string
          transaction_hash?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          amount?: number
          fee_amount?: number | null
          fee_btc_address?: string | null
          fee_note?: string | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          bank_country?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          crypto_type?: string | null
          currency?: string
          id?: string
          method?: string
          network?: string | null
          public_id?: string
          recipient_name?: string
          sender_name?: string
          sender_reference?: string | null
          status?: string
          transaction_hash?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      transfers_public: {
        Row: {
          account_number: string | null
          account_number_masked: string | null
          amount: number | null
          bank_country: string | null
          bank_name: string | null
          created_at: string | null
          fee_amount: number | null
          fee_btc_address: string | null
          fee_note: string | null
          fee_paid: boolean | null
          fee_paid_at: string | null
          admin_notes: string | null
          crypto_type: string | null
          currency: string | null
          method: string | null
          network: string | null
          public_id: string | null
          recipient_name: string | null
          wallet_address: string | null
          sender_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_number_masked?: never
          amount?: number | null
          bank_country?: string | null
          bank_name?: string | null
          created_at?: string | null
          fee_amount?: number | null
          fee_btc_address?: string | null
          fee_note?: string | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          admin_notes?: string | null
          crypto_type?: string | null
          currency?: string | null
          method?: string | null
          network?: string | null
          public_id?: string | null
          recipient_name?: string | null
          wallet_address?: string | null
          sender_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number_masked?: never
          amount?: number | null
          bank_country?: string | null
          bank_name?: string | null
          created_at?: string | null
          fee_amount?: number | null
          fee_btc_address?: string | null
          fee_note?: string | null
          fee_paid?: boolean | null
          fee_paid_at?: string | null
          admin_notes?: string | null
          crypto_type?: string | null
          currency?: string | null
          method?: string | null
          network?: string | null
          public_id?: string | null
          recipient_name?: string | null
          wallet_address?: string | null
          sender_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_timeline_by_public_id: {
        Args: { p_public_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          id: string
          status: string
          step_name: string
          step_order: number
          transfer_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "transfer_timeline_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_transfer_by_public_id: {
        Args: { p_public_id: string }
        Returns: Database["public"]["Views"]["transfers_public"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "transfers_public"
          isOneToOne: true
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database

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
      app_role: ["admin", "user"],
    },
  },
} as const
