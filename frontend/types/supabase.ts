/**
 * Supabase Database Types
 * 
 * Generated type definitions matching the Postgres schema.
 * Provides type-safety for database operations.
 */

export interface Database {
  public: {
    Tables: {
      meetings: {
        Row: {
          id: string;
          meeting_id: string;
          requested_at: string;
          participant_count: number;
          required_participant_count: number;
          optional_participant_count: number;
          duration_minutes: number;
          earliest_date: string;
          latest_date: string;
          buffer_minutes: number;
          success: boolean;
          total_candidates_evaluated: number;
          candidates_returned: number;
          processing_time_ms: number;
          negotiation_rounds: number;
          status: 'pending' | 'scheduled' | 'cancelled';
          selected_candidate_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at' | 'updated_at' | 'selected_candidate_id'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          selected_candidate_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>;
      };
      meeting_candidates: {
        Row: {
          id: string;
          meeting_id: string;
          slot_start: string;
          slot_end: string;
          slot_timezone: string;
          final_score: number;
          rank: number;
          availability_score: number;
          preference_score: number;
          optimization_score: number;
          conflict_proximity_score: number;
          fragmentation_score: number;
          all_participants_available: boolean;
          conflict_participant_ids: string[];
          reasoning: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meeting_candidates']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['meeting_candidates']['Insert']>;
      };
      score_breakdowns: {
        Row: {
          id: string;
          candidate_id: string;
          availability_factor: number;
          preference_factor: number;
          conflict_proximity_factor: number;
          fragmentation_factor: number;
          optimization_factor: number;
          availability_weight: number;
          preference_weight: number;
          conflict_proximity_weight: number;
          fragmentation_weight: number;
          optimization_weight: number;
          availability_details: Record<string, any> | null;
          conflict_proximity_details: Record<string, any> | null;
          fragmentation_details: Record<string, any> | null;
          optimization_details: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['score_breakdowns']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['score_breakdowns']['Insert']>;
      };
      scheduling_analytics: {
        Row: {
          id: string;
          meeting_id: string;
          estimated_time_saved_minutes: number;
          coordination_overhead_reduction_pct: number;
          top_candidate_confidence: number;
          avg_candidate_score: number;
          candidates_evaluated: number;
          total_conflicts: number;
          conflict_rate: number;
          most_constrained_participant_ids: string[];
          candidates_without_conflicts: number;
          total_participants: number;
          morning_people_ratio: number | null;
          avg_preferred_start_hour: number | null;
          avg_preferred_end_hour: number | null;
          buffer_sensitive_ratio: number | null;
          total_slots_evaluated: number;
          required_participants: number;
          optional_participants: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['scheduling_analytics']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['scheduling_analytics']['Insert']>;
      };
      participant_availability: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string;
          email: string;
          name: string;
          is_required: boolean;
          total_busy_slots: number;
          weekly_meeting_count: number;
          peak_meeting_hours: number[];
          preferred_days: string[];
          preferred_hours_start: number | null;
          preferred_hours_end: number | null;
          morning_person_score: number | null;
          avoids_back_to_back: boolean | null;
          buffer_minutes: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['participant_availability']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['participant_availability']['Insert']>;
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          google_event_id: string;
          google_calendar_id: string;
          title: string | null;
          description: string | null;
          location: string | null;
          start_time: string;
          end_time: string;
          timezone: string;
          is_all_day: boolean;
          status: string | null;
          visibility: string | null;
          attendee_count: number;
          is_organizer: boolean;
          response_status: string | null;
          is_recurring: boolean;
          recurring_event_id: string | null;
          source_platform: string | null;
          raw_event: Record<string, any> | null;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>;
      };
      user_accounts: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_accounts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_accounts']['Insert']>;
      };
      oauth_tokens: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['oauth_tokens']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['oauth_tokens']['Insert']>;
      };
    };
    Views: {
      v_top_candidates: {
        Row: {
          meeting_id: string;
          requested_at: string;
          slot_start: string;
          slot_end: string;
          final_score: number;
          rank: number;
          reasoning: string;
          participant_count: number;
          processing_time_ms: number;
        };
      };
      v_meeting_metrics: {
        Row: {
          date: string;
          total_meetings: number;
          successful_meetings: number;
          avg_processing_time_ms: number;
          avg_candidates_returned: number;
          avg_participant_count: number;
        };
      };
      v_score_distribution: {
        Row: {
          score_bucket: number;
          candidate_count: number;
          avg_availability: number;
          avg_preference: number;
          avg_proximity: number;
          avg_fragmentation: number;
        };
      };
    };
  };
}
