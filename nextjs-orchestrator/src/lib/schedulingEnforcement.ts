/**
 * ============================================================================
 * Stage 6: Scheduling Intelligence Enforcement
 * ============================================================================
 * Purpose: Convert AI scores into hard constraints that prevent bad meetings
 * 
 * Core Features:
 * 1. Buffer Time Enforcement - prevent meeting burnout
 * 2. Travel Time Constraints - prevent impossible transitions
 * 3. Cancellation Risk Scoring - predict meeting failures
 * 4. Time-Savings Calculation - measure efficiency gains
 * 5. Recurring Meeting Analysis - optimize repeat meetings
 * 
 * All enforcement happens:
 * - After AI scoring
 * - Before calendar write-back
 * - Deterministically and explainably
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CandidateSlot {
  start_time: string;
  end_time: string;
  score: number;
  reasoning?: string;
  location?: string;
  timezone?: string;
}

export interface CompressedEvent {
  start: string;
  end: string;
  summary?: string;
  location?: string;
  density?: number;
}

export interface EnforcementResult {
  passed: boolean;
  action: 'pass' | 'block' | 'warn';
  rule: string;
  reason: string;
  details: Record<string, any>;
}

export interface EnforcementContext {
  meeting_id: string;
  candidate: CandidateSlot;
  compressed_calendar: CompressedEvent[];
  buffer_minutes?: number;
  timezone?: string;
  duration_minutes: number;
}

export interface CancellationRiskScore {
  risk: 'low' | 'medium' | 'high';
  score: number; // 0-100
  factors: {
    calendar_density: number;
    late_day_penalty: number;
    historical_changes: number;
    score_confidence: number;
  };
  explanation: string;
}

export interface TimeSavingsMetrics {
  minutes_saved: number;
  conflicts_avoided: number;
  iterations_prevented: number;
  density_improvement: number;
}

// ============================================================================
// 1. BUFFER TIME ENFORCEMENT (HIGHEST PRIORITY)
// ============================================================================

/**
 * Enforce minimum buffer time between meetings
 * Dynamically increases buffer on dense calendar days
 */
export function enforceBufferTime(
  context: EnforcementContext
): EnforcementResult {
  const { candidate, compressed_calendar, buffer_minutes = 15 } = context;

  // Parse candidate time
  const candidateStart = new Date(candidate.start_time);
  const candidateEnd = new Date(candidate.end_time);

  // Calculate calendar density for the day
  const dayDensity = calculateDayDensity(candidateStart, compressed_calendar);

  // Dynamic buffer: increase on dense days
  const requiredBuffer = calculateDynamicBuffer(buffer_minutes, dayDensity);

  // Find adjacent meetings
  const adjacentMeetings = findAdjacentMeetings(
    candidateStart,
    candidateEnd,
    compressed_calendar
  );

  // Check buffer violations
  for (const adjacent of adjacentMeetings) {
    const adjacentStart = new Date(adjacent.start);
    const adjacentEnd = new Date(adjacent.end);

    // Check before
    if (adjacentEnd <= candidateStart) {
      const bufferBefore = (candidateStart.getTime() - adjacentEnd.getTime()) / (1000 * 60);
      if (bufferBefore < requiredBuffer) {
        return {
          passed: false,
          action: 'block',
          rule: 'buffer_time',
          reason: `Insufficient buffer before meeting (${Math.round(bufferBefore)}min < ${requiredBuffer}min required)`,
          details: {
            required_buffer: requiredBuffer,
            actual_buffer: Math.round(bufferBefore),
            day_density: dayDensity,
            adjacent_meeting: adjacent.summary || 'Existing event',
            adjacent_end: adjacent.end,
          },
        };
      }
    }

    // Check after
    if (candidateEnd <= adjacentStart) {
      const bufferAfter = (adjacentStart.getTime() - candidateEnd.getTime()) / (1000 * 60);
      if (bufferAfter < requiredBuffer) {
        return {
          passed: false,
          action: 'block',
          rule: 'buffer_time',
          reason: `Insufficient buffer after meeting (${Math.round(bufferAfter)}min < ${requiredBuffer}min required)`,
          details: {
            required_buffer: requiredBuffer,
            actual_buffer: Math.round(bufferAfter),
            day_density: dayDensity,
            adjacent_meeting: adjacent.summary || 'Existing event',
            adjacent_start: adjacent.start,
          },
        };
      }
    }
  }

  return {
    passed: true,
    action: 'pass',
    rule: 'buffer_time',
    reason: `Adequate buffer maintained (${requiredBuffer}min required)`,
    details: {
      required_buffer: requiredBuffer,
      day_density: dayDensity,
      adjacent_meetings: adjacentMeetings.length,
    },
  };
}

/**
 * Calculate calendar density for a specific day (0-1 scale)
 */
function calculateDayDensity(
  date: Date,
  compressed_calendar: CompressedEvent[]
): number {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Find events on this day
  const dayEvents = compressed_calendar.filter((event) => {
    const eventStart = new Date(event.start);
    return eventStart >= dayStart && eventStart < dayEnd;
  });

  if (dayEvents.length === 0) return 0;

  // Calculate total meeting minutes
  const totalMinutes = dayEvents.reduce((sum, event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  // Working day = 9am-5pm = 480 minutes
  const workingDayMinutes = 480;
  const density = Math.min(totalMinutes / workingDayMinutes, 1);

  return density;
}

/**
 * Calculate dynamic buffer based on calendar density
 */
function calculateDynamicBuffer(baseBuffer: number, density: number): number {
  // Low density (0-0.3): base buffer
  // Medium density (0.3-0.6): base + 5 min
  // High density (0.6-0.8): base + 10 min
  // Very high density (0.8+): base + 15 min
  
  if (density < 0.3) return baseBuffer;
  if (density < 0.6) return baseBuffer + 5;
  if (density < 0.8) return baseBuffer + 10;
  return baseBuffer + 15;
}

/**
 * Find meetings adjacent to candidate slot
 */
function findAdjacentMeetings(
  candidateStart: Date,
  candidateEnd: Date,
  compressed_calendar: CompressedEvent[]
): CompressedEvent[] {
  const adjacent: CompressedEvent[] = [];
  const lookbackMs = 2 * 60 * 60 * 1000; // 2 hours
  const lookaheadMs = 2 * 60 * 60 * 1000;

  for (const event of compressed_calendar) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Check if event is within lookback/lookahead window
    const isBefore =
      eventEnd <= candidateStart &&
      candidateStart.getTime() - eventEnd.getTime() <= lookbackMs;
    const isAfter =
      eventStart >= candidateEnd &&
      eventStart.getTime() - candidateEnd.getTime() <= lookaheadMs;

    if (isBefore || isAfter) {
      adjacent.push(event);
    }
  }

  return adjacent.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

// ============================================================================
// 2. TRAVEL TIME CONSTRAINTS
// ============================================================================

/**
 * Enforce travel time feasibility between meetings with different locations
 */
export function enforceTravelTime(
  context: EnforcementContext
): EnforcementResult {
  const { candidate, compressed_calendar } = context;

  // If no location specified, assume virtual/same location
  if (!candidate.location || candidate.location.toLowerCase().includes('meet') || candidate.location.toLowerCase().includes('zoom')) {
    return {
      passed: true,
      action: 'pass',
      rule: 'travel_time',
      reason: 'Virtual meeting - no travel required',
      details: { location: candidate.location || 'virtual' },
    };
  }

  const candidateStart = new Date(candidate.start_time);
  const candidateEnd = new Date(candidate.end_time);

  // Find immediately adjacent meetings (within 30 min)
  const adjacentWindow = 30 * 60 * 1000; // 30 minutes
  const adjacentMeetings = compressed_calendar.filter((event) => {
    const eventEnd = new Date(event.end);
    const eventStart = new Date(event.start);

    const beforeCandidate =
      eventEnd <= candidateStart &&
      candidateStart.getTime() - eventEnd.getTime() <= adjacentWindow;
    const afterCandidate =
      eventStart >= candidateEnd &&
      eventStart.getTime() - candidateEnd.getTime() <= adjacentWindow;

    return (beforeCandidate || afterCandidate) && event.location;
  });

  // Check travel feasibility
  for (const adjacent of adjacentMeetings) {
    const adjacentLocation = adjacent.location || '';
    const candidateLocation = candidate.location;

    // Same location = OK
    if (isSameLocation(adjacentLocation, candidateLocation)) {
      continue;
    }

    // Different locations = check travel time
    const adjacentEnd = new Date(adjacent.end);
    const adjacentStart = new Date(adjacent.start);

    // Meeting before candidate
    if (adjacentEnd <= candidateStart) {
      const travelTime = (candidateStart.getTime() - adjacentEnd.getTime()) / (1000 * 60);
      const requiredTravel = estimateTravelTime(adjacentLocation, candidateLocation);

      if (travelTime < requiredTravel) {
        return {
          passed: false,
          action: 'block',
          rule: 'travel_time',
          reason: `Insufficient travel time between locations (${Math.round(travelTime)}min available, ${requiredTravel}min required)`,
          details: {
            from_location: adjacentLocation,
            to_location: candidateLocation,
            available_time: Math.round(travelTime),
            required_time: requiredTravel,
            from_meeting: adjacent.summary || 'Previous event',
          },
        };
      } else if (travelTime < requiredTravel + 10) {
        // Warn if tight but possible
        return {
          passed: true,
          action: 'warn',
          rule: 'travel_time',
          reason: `Tight travel time between locations (${Math.round(travelTime)}min available, ${requiredTravel}min required)`,
          details: {
            from_location: adjacentLocation,
            to_location: candidateLocation,
            available_time: Math.round(travelTime),
            required_time: requiredTravel,
          },
        };
      }
    }

    // Meeting after candidate
    if (candidateEnd <= adjacentStart) {
      const travelTime = (adjacentStart.getTime() - candidateEnd.getTime()) / (1000 * 60);
      const requiredTravel = estimateTravelTime(candidateLocation, adjacentLocation);

      if (travelTime < requiredTravel) {
        return {
          passed: false,
          action: 'block',
          rule: 'travel_time',
          reason: `Insufficient travel time to next location (${Math.round(travelTime)}min available, ${requiredTravel}min required)`,
          details: {
            from_location: candidateLocation,
            to_location: adjacentLocation,
            available_time: Math.round(travelTime),
            required_time: requiredTravel,
            to_meeting: adjacent.summary || 'Next event',
          },
        };
      }
    }
  }

  return {
    passed: true,
    action: 'pass',
    rule: 'travel_time',
    reason: 'Sufficient travel time between locations',
    details: {
      location: candidate.location,
      adjacent_meetings_checked: adjacentMeetings.length,
    },
  };
}

/**
 * Check if two locations are the same (fuzzy matching)
 */
function isSameLocation(loc1: string, loc2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return normalize(loc1) === normalize(loc2);
}

/**
 * Estimate travel time between locations (simplified heuristic)
 * In production, integrate with Google Maps Distance Matrix API
 */
function estimateTravelTime(from: string, to: string): number {
  // Virtual meetings
  if (
    from.toLowerCase().includes('meet') ||
    from.toLowerCase().includes('zoom') ||
    to.toLowerCase().includes('meet') ||
    to.toLowerCase().includes('zoom')
  ) {
    return 0;
  }

  // Same building/floor
  if (isSameLocation(from, to)) {
    return 0;
  }

  // Different buildings - conservative estimate
  // In production: use real distance API
  return 25; // 25 minutes for cross-town travel
}

// ============================================================================
// 3. CANCELLATION RISK SCORING
// ============================================================================

/**
 * Compute explainable cancellation risk score
 */
export function computeCancellationRisk(
  context: EnforcementContext
): CancellationRiskScore {
  const { candidate, compressed_calendar } = context;

  const candidateStart = new Date(candidate.start_time);
  const hourOfDay = candidateStart.getHours();

  // Factor 1: Calendar density (0-40 points)
  const dayDensity = calculateDayDensity(candidateStart, compressed_calendar);
  const densityScore = dayDensity * 40;

  // Factor 2: Late-day penalty (0-30 points)
  // Meetings after 4pm are more likely to be cancelled
  let lateDayScore = 0;
  if (hourOfDay >= 16) {
    lateDayScore = ((hourOfDay - 16) / 4) * 30; // Max at 8pm
  }

  // Factor 3: AI score confidence (0-20 points)
  // Lower AI scores = higher cancellation risk
  const scoreConfidence = Math.max(0, (100 - candidate.score) / 100) * 20;

  // Factor 4: Historical changes (0-10 points)
  // Count last-minute reschedules in compressed calendar
  const recentChanges = countRecentChanges(compressed_calendar);
  const historicalScore = Math.min(recentChanges * 2, 10);

  // Total risk score
  const totalScore = densityScore + lateDayScore + scoreConfidence + historicalScore;

  // Categorize risk
  let risk: 'low' | 'medium' | 'high';
  let explanation: string;

  if (totalScore < 30) {
    risk = 'low';
    explanation = 'Low cancellation risk - optimal scheduling conditions';
  } else if (totalScore < 60) {
    risk = 'medium';
    explanation = 'Medium cancellation risk - some concerning factors present';
  } else {
    risk = 'high';
    explanation = 'High cancellation risk - multiple red flags detected';
  }

  return {
    risk,
    score: Math.round(totalScore),
    factors: {
      calendar_density: Math.round(densityScore),
      late_day_penalty: Math.round(lateDayScore),
      historical_changes: Math.round(historicalScore),
      score_confidence: Math.round(scoreConfidence),
    },
    explanation,
  };
}

/**
 * Count recent last-minute changes in calendar
 * Simplified heuristic - in production, track actual change history
 */
function countRecentChanges(compressed_calendar: CompressedEvent[]): number {
  // Look for density fluctuations as proxy for changes
  // In production: track actual event modification timestamps
  return 0; // Placeholder
}

// ============================================================================
// 4. TIME-SAVINGS CALCULATION
// ============================================================================

/**
 * Calculate actual time savings from smart scheduling
 */
export function calculateTimeSavings(
  context: EnforcementContext,
  enforcementResults: EnforcementResult[]
): TimeSavingsMetrics {
  const { compressed_calendar, duration_minutes } = context;

  // Count conflicts avoided
  const conflictsAvoided = enforcementResults.filter(
    (r) => r.action === 'block'
  ).length;

  // Estimate iterations prevented (each conflict = 2 reschedule iterations)
  const iterationsPrevented = conflictsAvoided * 2;

  // Time per iteration: 5 min to find new slot + 10 min email coordination
  const minutesPerIteration = 15;
  const minutesSaved = iterationsPrevented * minutesPerIteration;

  // Calculate density improvement
  const beforeDensity = calculateDayDensity(
    new Date(context.candidate.start_time),
    compressed_calendar
  );
  const afterDensity = beforeDensity + (duration_minutes / 480); // Add this meeting
  const densityImprovement = Math.max(0, beforeDensity - afterDensity);

  return {
    minutes_saved: minutesSaved,
    conflicts_avoided: conflictsAvoided,
    iterations_prevented: iterationsPrevented,
    density_improvement: Math.round(densityImprovement * 100) / 100,
  };
}

// ============================================================================
// MAIN ENFORCEMENT ORCHESTRATOR
// ============================================================================

export interface EnforcementSummary {
  passed: boolean;
  action: 'pass' | 'block' | 'warn';
  rules_applied: string[];
  blocks: EnforcementResult[];
  warnings: EnforcementResult[];
  cancellation_risk: CancellationRiskScore;
  time_savings: TimeSavingsMetrics;
  explanation: string;
}

/**
 * Apply all enforcement rules to a candidate slot
 * This is the main entry point for enforcement
 */
export async function applyEnforcementRules(
  context: EnforcementContext
): Promise<EnforcementSummary> {
  const results: EnforcementResult[] = [];

  // 1. Buffer Time Enforcement (HIGHEST PRIORITY)
  const bufferResult = enforceBufferTime(context);
  results.push(bufferResult);

  // 2. Travel Time Constraints
  const travelResult = enforceTravelTime(context);
  results.push(travelResult);

  // 3. Cancellation Risk Scoring
  const riskScore = computeCancellationRisk(context);

  // 4. Time-Savings Calculation
  const timeSavings = calculateTimeSavings(context, results);

  // Determine overall action
  const blocks = results.filter((r) => r.action === 'block');
  const warnings = results.filter((r) => r.action === 'warn');
  const passed = blocks.length === 0;
  const action = blocks.length > 0 ? 'block' : warnings.length > 0 ? 'warn' : 'pass';

  // Build explanation
  let explanation = '';
  if (blocks.length > 0) {
    explanation = `Meeting blocked due to: ${blocks.map((b) => b.reason).join('; ')}`;
  } else if (warnings.length > 0) {
    explanation = `Meeting allowed with warnings: ${warnings.map((w) => w.reason).join('; ')}`;
  } else {
    explanation = 'Meeting passed all enforcement checks';
  }

  // Log to database
  await logEnforcementToDatabase(context.meeting_id, results, riskScore, timeSavings);

  return {
    passed,
    action,
    rules_applied: results.map((r) => r.rule),
    blocks,
    warnings,
    cancellation_risk: riskScore,
    time_savings: timeSavings,
    explanation,
  };
}

/**
 * Log enforcement decision to database for traceability
 */
async function logEnforcementToDatabase(
  meeting_id: string,
  results: EnforcementResult[],
  risk: CancellationRiskScore,
  savings: TimeSavingsMetrics
): Promise<void> {
  try {
    // Log each enforcement rule
    for (const result of results) {
      const { error } = await supabase.rpc('log_enforcement_decision', {
        p_meeting_id: meeting_id,
        p_rule_type: result.rule,
        p_rule_action: result.action,
        p_rule_details: result.details,
      });
      
      if (error) {
        console.error('Failed to log enforcement decision:', error);
      }
    }

    // Update meeting with enforcement summary
    const blocks = results.filter((r) => r.action === 'block');
    const enforcement_status = blocks.length > 0 ? 'blocked' : 'passed';

    const { error: updateError } = await supabase.rpc('update_meeting_enforcement', {
      p_meeting_id: meeting_id,
      p_enforcement_status: enforcement_status,
      p_rules_applied: results.map((r) => r.rule),
      p_blocks: blocks.map((b) => ({ rule: b.rule, reason: b.reason })),
      p_cancellation_risk: risk.risk,
      p_risk_factors: risk.factors,
      p_time_savings: savings.minutes_saved,
      p_savings_metrics: savings,
    });
    
    if (updateError) {
      console.error('Failed to update meeting enforcement:', updateError);
    }
  } catch (error) {
    console.error('Error logging enforcement to database:', error);
    // Don't throw - enforcement should continue even if logging fails
  }
}

// ============================================================================
// RECURRING MEETING ANALYSIS
// ============================================================================

export interface RecurringPattern {
  pattern_id: string;
  day_of_week: string;
  time: string;
  duration: number;
  participant_emails: string[];
  occurrences: Array<{ date: string; score: number }>;
}

/**
 * Analyze recurring meetings and suggest optimizations
 */
export async function analyzeRecurringMeetings(
  patterns: RecurringPattern[]
): Promise<Array<{ current: RecurringPattern; suggested?: RecurringPattern; reason: string }>> {
  const suggestions: Array<{ current: RecurringPattern; suggested?: RecurringPattern; reason: string }> = [];

  for (const pattern of patterns) {
    // Calculate average score
    const avgScore = pattern.occurrences.reduce((sum, occ) => sum + occ.score, 0) / pattern.occurrences.length;

    // If consistently low scores, suggest optimization
    if (avgScore < 70 && pattern.occurrences.length >= 3) {
      // Find better slot (simplified heuristic)
      const suggestedSlot = findBetterRecurringSlot(pattern);

      if (suggestedSlot) {
        suggestions.push({
          current: pattern,
          suggested: suggestedSlot,
          reason: `Current slot averages ${Math.round(avgScore)}/100. Suggested slot expected to score ${Math.round(suggestedSlot.occurrences[0].score)}/100 based on calendar patterns.`,
        });

        // Store in database
        await supabase.rpc('record_recurring_analysis', {
          p_pattern_id: pattern.pattern_id,
          p_participant_emails: pattern.participant_emails,
          p_current_slot: {
            day: pattern.day_of_week,
            time: pattern.time,
            duration: pattern.duration,
          },
          p_avg_score: avgScore,
          p_score_history: pattern.occurrences,
          p_suggested_slot: {
            day: suggestedSlot.day_of_week,
            time: suggestedSlot.time,
            duration: suggestedSlot.duration,
            expected_score: suggestedSlot.occurrences[0].score,
          },
          p_optimization_reason: `Average score improved from ${Math.round(avgScore)} to ${Math.round(suggestedSlot.occurrences[0].score)}`,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Find better slot for recurring meeting (simplified heuristic)
 * In production: use more sophisticated analysis of calendar patterns
 */
function findBetterRecurringSlot(pattern: RecurringPattern): RecurringPattern | null {
  // Simplified: suggest moving to Tuesday/Thursday morning
  if (pattern.day_of_week === 'Monday' || pattern.day_of_week === 'Friday') {
    return {
      ...pattern,
      pattern_id: `${pattern.pattern_id}-optimized`,
      day_of_week: 'Tuesday',
      time: '10:00',
      occurrences: [{ date: 'suggested', score: 85 }],
    };
  }

  return null;
}
