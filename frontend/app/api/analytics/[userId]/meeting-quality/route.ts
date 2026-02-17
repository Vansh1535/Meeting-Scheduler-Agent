/**
 * API Route: /api/analytics/[userId]/meeting-quality
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

    const avgScore = analyticsRows.length > 0
      ? analyticsRows.reduce((sum: number, row: any) => sum + (Number(row.avg_candidate_score) || 0), 0) / analyticsRows.length
      : 0

    const avgConfidence = analyticsRows.length > 0
      ? analyticsRows.reduce((sum: number, row: any) => sum + (Number(row.top_candidate_confidence) || 0), 0) / analyticsRows.length
      : 0

    return NextResponse.json({
      score: Math.round(avgScore),
      confidence: Math.round(avgConfidence),
      sample_size: analyticsRows.length,
    })
  } catch (error: any) {
    console.error('Meeting-quality analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting quality', message: error.message },
      { status: 500 }
    )
  }
}
