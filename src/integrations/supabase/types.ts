export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BroadcastStatus = "verified" | "debunked" | "flagged" | "pending";
export type TranscriptStatus = "pending" | "processed" | "failed";

export type Database = {
  public: {
    Tables: {
      broadcasts: {
        Row: {
          confidence: number | null
          content: string
          created_at: string | null
          id: number
          source: string
          speaker: string | null
          status: BroadcastStatus | null
          timestamp: string | null
          transcript_status: TranscriptStatus | null
          updated_at: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          confidence?: number | null
          content: string
          created_at?: string | null
          id?: number
          source: string
          speaker?: string | null
          status?: BroadcastStatus | null
          timestamp?: string | null
          transcript_status?: TranscriptStatus | null
          updated_at?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          confidence?: number | null
          content?: string
          created_at?: string | null
          id?: number
          source?: string
          speaker?: string | null
          status?: BroadcastStatus | null
          timestamp?: string | null
          transcript_status?: TranscriptStatus | null
          updated_at?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      fact_checks: {
        Row: {
          broadcast_id: number | null
          confidence_score: number | null
          created_at: string | null
          explanation: string
          id: number
          updated_at: string | null
          verification_source: string
        }
        Insert: {
          broadcast_id?: number | null
          confidence_score?: number | null
          created_at?: string | null
          explanation: string
          id?: number
          updated_at?: string | null
          verification_source: string
        }
        Update: {
          broadcast_id?: number | null
          confidence_score?: number | null
          created_at?: string | null
          explanation?: string
          id?: number
          updated_at?: string | null
          verification_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_checks_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcasts"
            referencedColumns: ["id"]
          }
        ]
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

type PublicSchema = Database[Extract<keyof Database, "public">]