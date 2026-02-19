import { supabase } from '@/lib/supabase'

export type AnalyticsPeriod = 'week' | 'month' | 'year' | 'current_month'

const PERIOD_DAYS: Record<Exclude<AnalyticsPeriod, 'current_month'>, number> = {
  week: 7,
  month: 30,
  year: 365,
}

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date()
  
  if (period === 'current_month') {
    // Start of current calendar month
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  
  const days = PERIOD_DAYS[period as 'week' | 'month' | 'year']
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return start
}

export async function getUserMeetingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('participant_availability')
    .select('meeting_id')
    .eq('user_id', userId)

  if (error || !data) {
    return []
  }

  return data.map((row: { meeting_id: string }) => row.meeting_id)
}

export async function getMeetingsForUser(userId: string, period: AnalyticsPeriod) {
  const meetingIds = await getUserMeetingIds(userId)
  if (meetingIds.length === 0) return []

  const { data, error } = await supabase
    .from('meetings')
    .select('id, duration_minutes, requested_at, success, status')
    .in('id', meetingIds)
    .eq('status', 'scheduled') // Only count scheduled meetings

  if (error || !data) {
    return []
  }

  const start = getPeriodStart(period)
  return data.filter((meeting: any) => new Date(meeting.requested_at) >= start)
}

export async function getSchedulingAnalyticsForUser(userId: string, period: AnalyticsPeriod) {
  const meetingIds = await getUserMeetingIds(userId)
  if (meetingIds.length === 0) return []

  const { data, error } = await supabase
    .from('scheduling_analytics')
    .select('meeting_id, estimated_time_saved_minutes, coordination_overhead_reduction_pct, avg_candidate_score, top_candidate_confidence, candidates_evaluated, conflict_rate, candidates_without_conflicts, created_at')
    .in('meeting_id', meetingIds)

  if (error || !data) {
    return []
  }

  const start = getPeriodStart(period)
  return data.filter((row: any) => new Date(row.created_at) >= start)
}
