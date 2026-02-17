/**
 * API Route: /api/analytics/[userId]/insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMeetingsForUser, getSchedulingAnalyticsForUser } from '@/lib/analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const period = (request.nextUrl.searchParams.get('period') || 'month') as 'week' | 'month' | 'year'
    const { userId } = await params
    const meetings = await getMeetingsForUser(userId, period)
    const analyticsRows = await getSchedulingAnalyticsForUser(userId, period)

    const totalEvents = meetings.length
    const avgDuration = totalEvents > 0
      ? meetings.reduce((sum: number, m: any) => sum + (m.duration_minutes || 0), 0) / totalEvents
      : 0

    const avgConflictRate = analyticsRows.length > 0
      ? analyticsRows.reduce((sum: number, row: any) => sum + (Number(row.conflict_rate) || 0), 0) / analyticsRows.length
      : 0

    return NextResponse.json({
      total_events: totalEvents,
      average_duration_minutes: Math.round(avgDuration),
      average_conflict_rate: Math.round(avgConflictRate),
      period,
    })
  } catch (error: any) {
    console.error('Insights analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights', message: error.message },
      { status: 500 }
    )
  }
}
