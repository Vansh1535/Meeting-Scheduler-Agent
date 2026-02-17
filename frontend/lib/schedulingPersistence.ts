/**
 * Scheduling Persistence Service
 * 
 * Persists AI scheduling outputs to Supabase for:
 * - Analytics and reporting
 * - Explainability and debugging  
 * - Future UI rendering
 * 
 * Design: All AI logic remains in Python service (stateless).
 * This service only stores results, never modifies AI behavior.
 */

import { supabase } from './supabase';
import type { ScheduleRequest, ScheduleResponse } from '@/types/scheduling';

export interface PersistSchedulingResult {
  success: boolean;
  meetingId: string;
  dbMeetingId?: string;
  error?: string;
}

/**
 * Persist complete scheduling session to database.
 * 
 * Stores:
 * - Meeting metadata and constraints
 * - All candidate time slots with scores
 * - Detailed score breakdowns
 * - Analytics and metrics
 * - Participant availability summary
 * 
 * @param request - Original scheduling request
 * @param response - AI response from Python service
 * @returns Result with database IDs
 */
export async function persistSchedulingSession(
  request: ScheduleRequest,
  response: ScheduleResponse
): Promise<PersistSchedulingResult> {
  try {
    // 1. Insert meeting record
    const meetingResult = await insertMeeting(request, response);
    if (!meetingResult.success || !meetingResult.id) {
      return {
        success: false,
        meetingId: request.meeting_id,
        error: `Failed to insert meeting: ${meetingResult.error}`,
      };
    }

    const dbMeetingId = meetingResult.id;

    // 2. Insert candidates (with rank)
    const candidatesResult = await insertCandidates(
      dbMeetingId,
      response.candidates
    );
    if (!candidatesResult.success) {
      return {
        success: false,
        meetingId: request.meeting_id,
        dbMeetingId,
        error: `Failed to insert candidates: ${candidatesResult.error}`,
      };
    }

    // 3. Insert score breakdowns
    if (candidatesResult.candidateIds) {
      await insertScoreBreakdowns(
        candidatesResult.candidateIds,
        response.candidates
      );
      // Non-critical, continue even if fails
    }

    // 4. Insert analytics
    if (response.analytics) {
      await insertAnalytics(dbMeetingId, response.analytics);
      // Non-critical, continue even if fails
    }

    // 5. Insert participant availability
    await insertParticipantAvailability(dbMeetingId, request.participants);
    // Non-critical, continue even if fails

    return {
      success: true,
      meetingId: request.meeting_id,
      dbMeetingId,
    };
  } catch (error) {
    console.error('Error persisting scheduling session:', error);
    return {
      success: false,
      meetingId: request.meeting_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Insert meeting metadata record.
 */
async function insertMeeting(
  request: ScheduleRequest,
  response: ScheduleResponse
): Promise<{ success: boolean; id?: string; error?: string }> {
  const requiredCount = request.participants.filter(p => p.is_required).length;
  const optionalCount = request.participants.length - requiredCount;

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      meeting_id: request.meeting_id,
      participant_count: request.participants.length,
      required_participant_count: requiredCount,
      optional_participant_count: optionalCount,
      duration_minutes: request.constraints.duration_minutes,
      earliest_date: request.constraints.earliest_date,
      latest_date: request.constraints.latest_date,
      buffer_minutes: request.constraints.buffer_minutes,
      success: response.success,
      total_candidates_evaluated: response.total_candidates_evaluated,
      candidates_returned: response.candidates.length,
      processing_time_ms: response.processing_time_ms,
      negotiation_rounds: response.negotiation_rounds || 0,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to insert meeting:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/**
 * Insert candidate time slots with scores.
 * Returns candidate IDs for linking score breakdowns.
 */
async function insertCandidates(
  meetingId: string,
  candidates: ScheduleResponse['candidates']
): Promise<{ success: boolean; candidateIds?: string[]; error?: string }> {
  const candidateRows = candidates.map((candidate, index) => ({
    meeting_id: meetingId,
    slot_start: candidate.slot.start,
    slot_end: candidate.slot.end,
    slot_timezone: candidate.slot.timezone,
    final_score: candidate.score,
    rank: index + 1, // 1-based ranking
    availability_score: candidate.availability_score,
    preference_score: candidate.preference_score,
    optimization_score: candidate.optimization_score,
    conflict_proximity_score: candidate.conflict_proximity_score || 100.0,
    fragmentation_score: candidate.fragmentation_score || 100.0,
    all_participants_available: candidate.all_participants_available,
    conflict_participant_ids: candidate.conflicts || [],
    reasoning: candidate.reasoning || '',
  }));

  const { data, error } = await supabase
    .from('meeting_candidates')
    .insert(candidateRows)
    .select('id');

  if (error) {
    console.error('Failed to insert candidates:', error);
    return { success: false, error: error.message };
  }

  const candidateIds = data.map(row => row.id);
  return { success: true, candidateIds };
}

/**
 * Insert detailed score breakdowns for explainability.
 */
async function insertScoreBreakdowns(
  candidateIds: string[],
  candidates: ScheduleResponse['candidates']
): Promise<void> {
  const breakdownRows = candidateIds.map((candidateId, index) => {
    const candidate = candidates[index];
    const breakdown = candidate.score_breakdown;

    // Extract details from breakdown if available
    const availabilityDetails = breakdown?.availability_details || null;
    const conflictProximityDetails = breakdown?.conflict_proximity_details || null;
    const fragmentationDetails = breakdown?.fragmentation_details || null;
    const optimizationDetails = breakdown?.optimization_details || null;

    // Use weights from breakdown or defaults
    const weights = breakdown?.weights || {
      availability: 35,
      preference: 25,
      conflict_proximity: 20,
      fragmentation: 15,
      optimization: 5,
    };

    return {
      candidate_id: candidateId,
      availability_factor: breakdown?.availability || candidate.availability_score,
      preference_factor: breakdown?.preference || candidate.preference_score,
      conflict_proximity_factor: breakdown?.conflict_proximity || (candidate.conflict_proximity_score || 100.0),
      fragmentation_factor: breakdown?.fragmentation || (candidate.fragmentation_score || 100.0),
      optimization_factor: breakdown?.optimization || candidate.optimization_score,
      availability_weight: weights.availability,
      preference_weight: weights.preference,
      conflict_proximity_weight: weights.conflict_proximity,
      fragmentation_weight: weights.fragmentation,
      optimization_weight: weights.optimization,
      availability_details: availabilityDetails,
      conflict_proximity_details: conflictProximityDetails,
      fragmentation_details: fragmentationDetails,
      optimization_details: optimizationDetails,
    };
  });

  const { error } = await supabase
    .from('score_breakdowns')
    .insert(breakdownRows);

  if (error) {
    console.error('Failed to insert score breakdowns:', error);
  }
}

/**
 * Insert analytics and metrics.
 */
async function insertAnalytics(
  meetingId: string,
  analytics: Record<string, any>
): Promise<void> {
  const groupPrefs = analytics.group_preferences || {};

  const { error } = await supabase
    .from('scheduling_analytics')
    .insert({
      meeting_id: meetingId,
      estimated_time_saved_minutes: analytics.estimated_time_saved_minutes || 0,
      coordination_overhead_reduction_pct: analytics.coordination_overhead_reduction_pct || 0,
      top_candidate_confidence: analytics.top_candidate_confidence || 0,
      avg_candidate_score: analytics.avg_candidate_score || 0,
      candidates_evaluated: analytics.candidates_evaluated || 0,
      total_conflicts: analytics.total_conflicts || 0,
      conflict_rate: analytics.conflict_rate || 0,
      most_constrained_participant_ids: analytics.most_constrained_participants || [],
      candidates_without_conflicts: analytics.candidates_without_conflicts || 0,
      total_participants: groupPrefs.total_participants || 0,
      morning_people_ratio: groupPrefs.morning_people_ratio || null,
      avg_preferred_start_hour: groupPrefs.avg_preferred_start_hour || null,
      avg_preferred_end_hour: groupPrefs.avg_preferred_end_hour || null,
      buffer_sensitive_ratio: groupPrefs.buffer_sensitive_ratio || null,
      total_slots_evaluated: analytics.total_slots_evaluated || 0,
      required_participants: analytics.required_participants || 0,
      optional_participants: analytics.optional_participants || 0,
    });

  if (error) {
    console.error('Failed to insert analytics:', error);
  }
}

/**
 * Insert participant availability summary.
 */
async function insertParticipantAvailability(
  meetingId: string,
  participants: ScheduleRequest['participants']
): Promise<void> {
  const participantRows = participants.map(participant => {
    const calendar = participant.calendar_summary;
    const preferences = calendar.preference_patterns;

    return {
      meeting_id: meetingId,
      user_id: participant.user_id,
      email: participant.email,
      name: participant.name,
      is_required: participant.is_required,
      total_busy_slots: calendar.busy_slots?.length || 0,
      weekly_meeting_count: calendar.weekly_meeting_count || 0,
      peak_meeting_hours: calendar.peak_meeting_hours || [],
      preferred_days: preferences?.preferred_days || [],
      preferred_hours_start: preferences?.preferred_hours_start || null,
      preferred_hours_end: preferences?.preferred_hours_end || null,
      morning_person_score: preferences?.morning_person_score || null,
      avoids_back_to_back: preferences?.avoids_back_to_back || null,
      buffer_minutes: preferences?.buffer_minutes || null,
    };
  });

  const { error } = await supabase
    .from('participant_availability')
    .insert(participantRows);

  if (error) {
    console.error('Failed to insert participant availability:', error);
  }
}
