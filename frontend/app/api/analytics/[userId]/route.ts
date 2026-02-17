/**
 * API Route: /api/analytics/[userId]
 * Returns summary analytics for the given user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMeetingsForUser } from '@/lib/analytics'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const period = (_request.nextUrl.searchParams.get('period') || 'month') as 'week' | 'month' | 'year'
    const { userId } = await params
    const meetings = await getMeetingsForUser(userId, period)

    const totalEvents = meetings.length
    const completedEvents = meetings.filter((m: any) => m.success).length
    const timeScheduledMinutes = meetings.reduce((sum: number, m: any) => sum + (m.duration_minutes || 0), 0)

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
