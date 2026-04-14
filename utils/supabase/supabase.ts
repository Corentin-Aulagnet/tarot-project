/**
 * ============================================================================
 * SUPABASE AUTO-GENERATED SCHEMA TYPES (supabase.ts)
 * ============================================================================
 * 
 * IMPORTANT: This file is auto-generated from the Supabase database schema.
 * DO NOT edit manually. Regenerate with:
 *   supabase gen types typescript --local
 * 
 * This file exports TypeScript types for:
 * - Database row types (Games, Players)
 * - Insert/Update types for mutations
 * - Enums for type-safe field values
 * 
 * ============================================================================
 * 
 * KEY TABLES
 * ──────────
 * 
 * **Games Table**
 * ───────────────
 * Stores every Tarot game session with all scoring context.
 * 
 * Fields:
 *   - id (UUID, PK)
 *   - created_at (timestamp): When game was recorded
 *   - players_uid (UUID[]): All players who participated in this game
 *   - taker_id (FK→Players): Player attacking/bidding
 *   - call_id (FK→Players): Second attacker (optional; can equal taker_id for 4x multiplier)
 *   - contract (enum): Bid level (Petite/Garde/Garde-Sans/Garde-Contre)
 *   - n_bouts (int, 0-3): Number of special cards in attack tricks (Fool, XXI, Jack of Trumps)
 *   - points_att (int, 0-91): Total pip points scored by attack team
 *   - petit_au_bout (enum): Did attack/defense win the Fool in final trick? ("Won" or "Lost")
 *   - petit_au_bout_player_id (FK→Players): Who had the Fool? (taker, caller, or defender)
 *   - poignee_type (enum): Hand bonus (Simple/Double/Triple) for holding trump cards
 *   - poignee_player_id (FK→Players): Which player claimed the hand bonus?
 *   - chelem (enum): Grand slam result (AnnoucedFailed/AnnoucedSucceeded/UnannoucedSucceeded)
 *   - chelem_player_id (FK→Players): Which player attempted the grand slam?
 *   - misere_type (enum): Special penalty situation ("Tête" or "Atout")
 *   - misere_player_id (FK→Players): Player incurring the misère penalty
 * 
 * Foreign Key Relationships:
 *   taker_id → Players.id
 *   call_id → Players.id
 *   petit_au_bout_player_id → Players.id
 *   poignee_player_id → Players.id
 *   chelem_player_id → Players.id
 *   misere_player_id → Players.id
 * 
 * NOTE: players_uid is an ARRAY; other *_id fields are single UUIDs.
 *       Use supabase.from('Games').insert(row) to insert; types enforce required/optional fields.
 * 
 * **Players Table**
 * ────────────────
 * Registry of all players who have played games.
 * 
 * Fields:
 *   - id (UUID, PK): Auto-generated player ID
 *   - created_at (timestamp): When player joined
 *   - Name (string): Player's display name
 * 
 * ============================================================================
 * 
 * ENUMS (Type-Safe Field Values)
 * ───────────────────────────────
 * 
 * **Contract** - Bid level and scoring multiplier
 *   - "Petite" → 1x multiplier
 *   - "Garde" → 2x multiplier
 *   - "Garde-Sans" → 4x multiplier (hand alone)
 *   - "Garde-Contre" → 6x multiplier (maximum)
 * 
 * **Petit_au_bout** - Did attack/defense win the Fool in final trick?
 *   - "Won" → Attack/declarer team won it (bonus to them)
 *   - "Lost" → Defense won it (penalty to attack)
 * 
 * **Poignee** - Hand bonus (holding many trump cards)
 *   - "Simple" → 8-9 trumps: +20 points
 *   - "Double" → 10-12 trumps: +30 points
 *   - "Triple" → 13+ trumps: +40 points
 * 
 * **Chelem** - Grand slam (winning all tricks)
 *   - "AnnoucedFailed" → Declared all tricks but failed: −200 points
 *   - "AnnoucedSucceeded" → Declared and succeeded: +400 points
 *   - "UnannoucedSucceeded" → Succeeded without declaration: +200 points
 * 
 * **Misere** - Special penalty situations (rare)
 *   - "Tête" → Specific card lost improperly: −10 (typically)
 *   - "Atout" → Trump lost improperly: −10 (typically)
 * 
 * ============================================================================
 * 
 * USAGE IN CODE
 * ─────────────
 * 
 * Import types:
 *   import { Games, Players } from '@/utils/supabase/supabase';
 * 
 * Use in scoring:
 *   function calculateScore(game: Games, players: Players[]): Record<Players['id'], number> { ... }
 * 
 * Create new game (insert row):
 *   const { data, error } = await supabase
 *     .from('Games')
 *     .insert([{ 
 *       taker_id: "...",
 *       call_id: "...",
 *       contract: "Garde",
 *       n_bouts: 2,
 *       points_att: 65,
 *       players_uid: ["...", "...", "..."],
 *       // ... other required/optional fields
 *     }]);
 * 
 * Update existing game:
 *   const { data, error } = await supabase
 *     .from('Games')
 *     .update({ contract: "Garde-Sans", points_att: 70 })
 *     .eq('id', gameId);
 * 
 * ============================================================================
 */

export type Games = Database["public"]["Tables"]["Games"]["Row"];
export function getWinningTeam(game: Games): string[] {
  // Implementation for determining the winning team
  const attackers = [game.taker_id, game.call_id].filter(id => id !== null) as string[];
  const defenders = game.players_uid.filter(id => !attackers.includes(id));
  const attackWon = (game.points_att >= 56 && game.n_bouts === 0) || (game.points_att >= 51 && game.n_bouts === 1) || (game.points_att >= 41 && game.n_bouts === 2) || (game.points_att >= 36 && game.n_bouts === 3);
  return attackWon ? attackers : defenders;
}
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
          petit_au_bout: Database["public"]["Enums"]["Petit_au_bout"] | null
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
          petit_au_bout?: Database["public"]["Enums"]["Petit_au_bout"] | null
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
          petit_au_bout?: Database["public"]["Enums"]["Petit_au_bout"] | null
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
      get_games_by_player: {
        Args: { player_id: string }
        Returns: {
          call_id: string
          chelem: Database["public"]["Enums"]["Chelem"] | null
          chelem_player_id: string | null
          contract: Database["public"]["Enums"]["Contract"]
          created_at: string
          id: string
          misere_player_id: string | null
          misere_type: Database["public"]["Enums"]["Misere"] | null
          n_bouts: number
          petit_au_bout: Database["public"]["Enums"]["Petit_au_bout"] | null
          petit_au_bout_player_id: string | null
          players_uid: string[]
          poignee_player_id: string | null
          poignee_type: Database["public"]["Enums"]["Poignee"] | null
          points_att: number
          taker_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "Games"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      Chelem: "AnnoucedFailed" | "AnnoucedSucceeded" | "UnannoucedSucceeded"
      Contract: "Petite" | "Garde" | "Garde-Sans" | "Garde-Contre"
      Misere: "Tête" | "Atout"
      Petit_au_bout: "Lost" | "Won"
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
      Petit_au_bout: ["Lost", "Won"],
      Poignee: ["Simple", "Double", "Triple"],
    },
  },
} as const
