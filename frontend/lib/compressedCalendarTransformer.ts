/**
 * Compressed Calendar Transformer
 * 
 * Transforms ScaleDown compressed calendar data into format expected by Python AI Brain.
 * Converts compressed patterns into CompressedCalendarSummary format.
 */

import { getActiveCompressedCalendar } from './calendarSync';
import { CompressedCalendarSummary, TimeSlot, PreferencePattern, DayOfWeek } from '@/types/scheduling';

const DAY_MAP: { [key: number]: DayOfWeek } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

/**
 * Get compressed calendar summary for user (ready for Python AI)
 */
export async function getCompressedCalendarForUser(
  userId: string,
  timezone: string = 'UTC'
): Promise<CompressedCalendarSummary | null> {
  // Fetch active compressed calendar from database
  const compressed = await getActiveCompressedCalendar(userId);

  if (!compressed) {
    console.warn(`⚠️  No compressed calendar found for user ${userId}`);
    return null;
  }

  console.log(`📊 Transforming compressed calendar for user ${userId}...`);

  // Transform ScaleDown compressed data to Python AI format
  const busySlots = generateBusySlotsFromPatterns(
    compressed.availability_patterns,
    compressed.busy_probability_map,
    timezone
  );

  const peakHours = extractPeakMeetingHours(compressed.meeting_density_scores);

  const preferencePatterns = transformPreferencePatterns(
    compressed.preferred_meeting_times,
    compressed.typical_work_hours,
    compressed.average_meeting_duration_minutes
  );

  // Calculate compression period in days
  const periodStart = new Date(compressed.period_start);
  const periodEnd = new Date(compressed.period_end);
  const compressionPeriodDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate weekly meeting count from insights
  const weeklyMeetingCount = Math.round(compressed.source_event_count / (compressionPeriodDays / 7));

  return {
    user_id: userId,
    timezone,
    busy_slots: busySlots,
    weekly_meeting_count: weeklyMeetingCount,
    peak_meeting_hours: peakHours,
    preference_patterns: preferencePatterns,
    data_compressed: true,
    compression_period_days: compressionPeriodDays,
  };
}

/**
 * Generate busy time slots from ScaleDown availability patterns
 * 
 * Converts weekly recurring patterns into concrete time slots for next 4 weeks.
 */
function generateBusySlotsFromPatterns(
  availabilityPatterns: any,
  busyProbabilityMap: any,
  timezone: string
): TimeSlot[] {
  const busySlots: TimeSlot[] = [];
  const weeksToGenerate = 4; // Generate 4 weeks of busy slots

  if (!availabilityPatterns?.weekly_busy_slots) {
    return busySlots;
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Go to Sunday of current week
  startOfWeek.setHours(0, 0, 0, 0);

  // Generate busy slots for next 4 weeks based on patterns
  for (let weekOffset = 0; weekOffset < weeksToGenerate; weekOffset++) {
    for (const pattern of availabilityPatterns.weekly_busy_slots) {
      const { day_of_week, start_hour, start_minute, duration_minutes, confidence } = pattern;

      // Only include high-confidence busy slots (>0.7)
      if (confidence < 0.7) continue;

      // Calculate date for this instance
      const slotDate = new Date(startOfWeek);
      slotDate.setDate(startOfWeek.getDate() + (weekOffset * 7) + day_of_week);
      slotDate.setHours(start_hour, start_minute, 0, 0);

      const startTime = new Date(slotDate);
      const endTime = new Date(slotDate);
      endTime.setMinutes(endTime.getMinutes() + duration_minutes);

      busySlots.push({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        timezone,
      });
    }
  }

  return busySlots;
}

/**
 * Extract peak meeting hours from density scores
 */
function extractPeakMeetingHours(meetingDensityScores: any): number[] {
  if (!meetingDensityScores?.by_hour_of_day) {
    return [10, 14]; // Default: 10 AM and 2 PM
  }

  // Get top 3 hours with highest density
  const hourDensities = Object.entries(meetingDensityScores.by_hour_of_day)
    .map(([hour, density]) => ({ hour: parseInt(hour), density: density as number }))
    .sort((a, b) => b.density - a.density)
    .slice(0, 3);

  return hourDensities.map(({ hour }) => hour);
}

/**
 * Transform ScaleDown preferred times into preference patterns
 */
function transformPreferencePatterns(
  preferredMeetingTimes: any,
  typicalWorkHours: any,
  avgMeetingDuration: number
): PreferencePattern | undefined {
  if (!preferredMeetingTimes || preferredMeetingTimes.length === 0) {
    return undefined;
  }

  // Extract preferred days from top preferred times
  const preferredDays = Array.from(
    new Set(
      preferredMeetingTimes
        .slice(0, 5) // Top 5 preferred slots
        .map((slot: any) => DAY_MAP[slot.day_of_week])
    )
  ) as DayOfWeek[];

  // Calculate average preferred hours from preferred times
  const preferredHours = preferredMeetingTimes.map((slot: any) => slot.start_hour);
  const minHour = Math.min(...preferredHours);
  const maxHour = Math.max(...preferredHours);

  // Calculate morning vs afternoon preference
  const morningSlots = preferredMeetingTimes.filter((slot: any) => slot.start_hour < 12);
  const afternoonSlots = preferredMeetingTimes.filter((slot: any) => slot.start_hour >= 12);
  const morningScore = morningSlots.length / (morningSlots.length + afternoonSlots.length);

  // Determine buffer preference from work hour patterns
  const hasConsistentWorkHours = typicalWorkHours && Object.keys(typicalWorkHours).length > 0;
  const avoidsBackToBack = hasConsistentWorkHours; // Infer from structured schedule

  return {
    preferred_days: preferredDays,
    preferred_hours_start: minHour,
    preferred_hours_end: maxHour + 1, // Add 1 hour for end range
    avg_meeting_duration_minutes: avgMeetingDuration || 60,
    buffer_minutes: avoidsBackToBack ? 15 : 0,
    avoids_back_to_back: avoidsBackToBack,
    morning_person_score: morningScore || 0.5,
  };
}

/**
 * Generate mock compressed calendar (fallback when no real data available)
 */
export function generateMockCompressedCalendar(
  userId: string,
  timezone: string = 'UTC'
): CompressedCalendarSummary {
  console.warn(`⚠️  Using mock compressed calendar for user ${userId} (no real data available)`);

  return {
    user_id: userId,
    timezone,
    busy_slots: [
      // Mock: Minimal busy slots to allow more availability
      // Just one slot on Saturday (weekend, shouldn't affect weekday scheduling)
      {
        start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // Tomorrow at 10 AM
        end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(), // Tomorrow at 11 AM
        timezone,
      },
    ],
    weekly_meeting_count: 8,
    peak_meeting_hours: [10, 14],
    preference_patterns: {
      preferred_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      preferred_hours_start: 9,
      preferred_hours_end: 17,
      avg_meeting_duration_minutes: 60,
      buffer_minutes: 15,
      avoids_back_to_back: true,
      morning_person_score: 0.6,
    },
    data_compressed: false, // Not real compressed data
    compression_period_days: 0,
  };
}

/**
 * Get compressed calendars for multiple users
 */
export async function getCompressedCalendarsForUsers(
  userIds: string[],
  timezone: string = 'UTC'
): Promise<Map<string, CompressedCalendarSummary>> {
  const calendars = new Map<string, CompressedCalendarSummary>();

  for (const userId of userIds) {
    const calendar = await getCompressedCalendarForUser(userId, timezone);
    
    if (calendar) {
      calendars.set(userId, calendar);
    } else {
      // Use mock data as fallback
      calendars.set(userId, generateMockCompressedCalendar(userId, timezone));
    }
  }

  return calendars;
}
