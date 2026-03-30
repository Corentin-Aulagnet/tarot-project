export type Games = Database["public"]["Tables"]["Games"]["Row"];
export type Players = Database["public"]["Tables"]["Players"]["Row"];
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
    PostgrestVersion: "14.4"
  }
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
  public: {
    Tables: {
      Games: {
        Row: {
          call_id: string
          chelem: Database["public"]["Enums"]["Chelem"] | null
          chelem_player_id: string | null
          contract: Database["public"]["Enums"]["Contract"]
          created_at: string
          id: string
          misere_player_id: string | null
          misere_type: Database["public"]["Enums"]["Misere"] | null
          n_bouts: number
          petit_au_bout_lost: boolean | null
          petit_au_bout_player_id: string | null
          players_uid: string[]
          poignee_player_id: string | null
          poignee_type: Database["public"]["Enums"]["Poignee"] | null
          points_att: number
          taker_id: string
        }
        Insert: {
          call_id: string
          chelem?: Database["public"]["Enums"]["Chelem"] | null
          chelem_player_id?: string | null
          contract?: Database["public"]["Enums"]["Contract"]
          created_at?: string
          id?: string
          misere_player_id?: string | null
          misere_type?: Database["public"]["Enums"]["Misere"] | null
          n_bouts: number
          petit_au_bout_lost?: boolean | null
          petit_au_bout_player_id?: string | null
          players_uid: string[]
          poignee_player_id?: string | null
          poignee_type?: Database["public"]["Enums"]["Poignee"] | null
          points_att: number
          taker_id: string
        }
        Update: {
          call_id?: string
          chelem?: Database["public"]["Enums"]["Chelem"] | null
          chelem_player_id?: string | null
          contract?: Database["public"]["Enums"]["Contract"]
          created_at?: string
          id?: string
          misere_player_id?: string | null
          misere_type?: Database["public"]["Enums"]["Misere"] | null
          n_bouts?: number
          petit_au_bout_lost?: boolean | null
          petit_au_bout_player_id?: string | null
          players_uid?: string[]
          poignee_player_id?: string | null
          poignee_type?: Database["public"]["Enums"]["Poignee"] | null
          points_att?: number
          taker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Games_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "Players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Games_chelem_player_id_fkey"
            columns: ["chelem_player_id"]
            isOneToOne: false
            referencedRelation: "Players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Games_misere_player_id_fkey"
            columns: ["misere_player_id"]
            isOneToOne: false
            referencedRelation: "Players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Games_petit_au_bout_player_id_fkey"
            columns: ["petit_au_bout_player_id"]
            isOneToOne: false
            referencedRelation: "Players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Games_poignee_player_id_fkey"
            columns: ["poignee_player_id"]
            isOneToOne: false
            referencedRelation: "Players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Games_taker_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "Players"
            referencedColumns: ["id"]
          },
        ]
      }
      Players: {
        Row: {
          created_at: string
          id: string
          Name: string
        }
        Insert: {
          created_at?: string
          id?: string
          Name: string
        }
        Update: {
          created_at?: string
          id?: string
          Name?: string
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
      Chelem: "AnnoucedFailed" | "AnnoucedSucceeded" | "UnannoucedSucceeded"
      Contract: "Petite" | "Garde" | "Garde-Sans" | "Garde-Contre"
      Misere: "Tête" | "Atout"
      Poignee: "Simple" | "Double" | "Triple"
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
  public: {
    Enums: {
      Chelem: ["AnnoucedFailed", "AnnoucedSucceeded", "UnannoucedSucceeded"],
      Contract: ["Petite", "Garde", "Garde-Sans", "Garde-Contre"],
      Misere: ["Tête", "Atout"],
      Poignee: ["Simple", "Double", "Triple"],
    },
  },
} as const
