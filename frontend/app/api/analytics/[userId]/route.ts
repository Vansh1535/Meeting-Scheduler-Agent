/**
 * API Route: /api/analytics/[userId]
 * Returns summary analytics for the given user within a time period.
 * Counts BOTH calendar_events (Google Calendar) AND meetings (AI-scheduled)
 * 
 * Period types:
 * - 'current_month': Current calendar month (e.g., Feb 1 - Feb 28) - for Dashboard
 * - 'month': Last 30 days rolling - for Analytics page
 * - 'week': Last 7 days rolling
 * - 'year': Last 365 days rolling
 * 
 * Marks past events as "completed" for accurate productivity tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMeetingsForUser } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const period = (_request.nextUrl.searchParams.get('period') || 'month') as 'week' | 'month' | 'year' | 'current_month'
    const { userId } = await params
    
    // Calculate date range based on period
    let startDate: Date
    let endDate: Date = new Date()
    
    if (period === 'current_month') {
      // Current calendar month (e.g., Feb 1 - Feb 28)
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      // Set end date to last day of current month at 23:59:59
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    } else {
      // Rolling period (last N days)
      const periodDays = {
        week: 7,
        month: 30,
        year: 365,
      }
      const daysAgo = periodDays[period as 'week' | 'month' | 'year'] || 30
      startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
    }
    
    const startDateISO = startDate.toISOString()
    const endDateISO = endDate.toISOString()
    
    // Get AI-scheduled meetings
    const meetings = await getMeetingsForUser(userId, period)
    
    // Get Google Calendar events within the period (with both start and end bounds)
    const { data: calendarEvents, error: calendarError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDateISO)
      .lte('start_time', endDateISO)
    
    if (calendarError) {
      console.error('Calendar events query error:', calendarError)
    }
    
    const calendarEventsInPeriod = calendarEvents || []
    const now = new Date()
    
    // Count completed calendar events (events that have already ended)
    const completedCalendarEvents = calendarEventsInPeriod.filter((event: any) => {
      const endTime = new Date(event.end_time || event.endTime)
      return endTime < now
    }).length
    
    // Count completed AI meetings
    const completedAIMeetings = meetings.filter((m: any) => m.success).length
    
    // TOTAL = Calendar events in period + AI meetings in period
    const totalEvents = calendarEventsInPeriod.length + meetings.length
    const completedEvents = completedCalendarEvents + completedAIMeetings
    
    // Calculate total time scheduled from both sources
    const aiMeetingsMinutes = meetings.reduce((sum: number, m: any) => sum + (m.duration_minutes || 0), 0)
    const calendarMinutes = calendarEventsInPeriod.reduce((sum: number, event: any) => {
      const start = new Date(event.start_time || event.startTime)
      const end = new Date(event.end_time || event.endTime)
      const diffMs = end.getTime() - start.getTime()
      return sum + (diffMs / 60000) // Convert ms to minutes
    }, 0)
    const timeScheduledMinutes = aiMeetingsMinutes + calendarMinutes

    const productivity = totalEvents > 0
      ? Math.round((completedEvents / totalEvents) * 100)
      : 0

    return NextResponse.json({
      totalEvents,
      timeScheduled: Math.round((timeScheduledMinutes / 60) * 10) / 10,
      completedEvents,
      productivity,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error.message },
      { status: 500 }
    )
  }
}
