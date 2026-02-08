/**
 * TypeScript types matching Python FastAPI service schemas.
 * These types ensure type safety when forwarding requests to the Python AI Brain.
 */

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  timezone: string;
}

export interface PreferencePattern {
  preferred_days: DayOfWeek[];
  preferred_hours_start: number;
  preferred_hours_end: number;
  avg_meeting_duration_minutes: number;
  buffer_minutes: number;
  avoids_back_to_back: boolean;
  morning_person_score: number;
}

export interface CompressedCalendarSummary {
  user_id: string;
  timezone: string;
  busy_slots: TimeSlot[];
  weekly_meeting_count: number;
  peak_meeting_hours: number[];
  preference_patterns?: PreferencePattern;
  data_compressed: boolean;
  compression_period_days: number;
}

export interface Participant {
  user_id: string;
  email: string;
  name: string;
  is_required: boolean;
  calendar_summary: CompressedCalendarSummary;
}

export interface SchedulingConstraints {
  duration_minutes: number;
  earliest_date: string; // ISO 8601 datetime
  latest_date: string; // ISO 8601 datetime
  working_hours_start: number;
  working_hours_end: number;
  allowed_days: DayOfWeek[];
  buffer_minutes: number;
  timezone: string;
  max_candidates: number;
}

export interface ScheduleRequest {
  meeting_id: string;
  participants: Participant[];
  constraints: SchedulingConstraints;
  preferences?: Record<string, any>;
}

export interface MeetingSlotCandidate {
  slot: TimeSlot;
  score: number;
  availability_score: number;
  preference_score: number;
  optimization_score: number;
  conflicts: string[];
  all_participants_available: boolean;
  reasoning: string;
}

export interface ScheduleResponse {
  meeting_id: string;
  candidates: MeetingSlotCandidate[];
  total_candidates_evaluated: number;
  processing_time_ms: number;
  negotiation_rounds: number;
  analytics: Record<string, any>;
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
}
