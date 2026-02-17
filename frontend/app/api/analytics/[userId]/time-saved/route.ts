/**
 * API Route: /api/analytics/[userId]/time-saved
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSchedulingAnalyticsForUser } from '@/lib/analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const period = (request.nextUrl.searchParams.get('period') || 'month') as 'week' | 'month' | 'year'
    const { userId } = await params
    const analyticsRows = await getSchedulingAnalyticsForUser(userId, period)

    const minutesSaved = analyticsRows.reduce(
      (sum: number, row: any) => sum + (Number(row.estimated_time_saved_minutes) || 0),
      0
    )

    const conflictsAvoided = analyticsRows.reduce(
      (sum: number, row: any) => sum + (Number(row.candidates_without_conflicts) || 0),
      0
    )

    const iterationsPrevented = analyticsRows.reduce(
      (sum: number, row: any) => sum + (Number(row.candidates_evaluated) || 0),
      0
    )

    const avgOverheadReduction = analyticsRows.length > 0
      ? analyticsRows.reduce((sum: number, row: any) => sum + (Number(row.coordination_overhead_reduction_pct) || 0), 0) / analyticsRows.length
      : 0

    return NextResponse.json({
      minutes_saved: Math.round(minutesSaved),
      conflicts_avoided: Math.round(conflictsAvoided),
      iterations_prevented: Math.round(iterationsPrevented),
      density_improvement: Math.round(avgOverheadReduction),
    })
  } catch (error: any) {
    console.error('Time-saved analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time saved analytics', message: error.message },
      { status: 500 }
    )
  }
}
