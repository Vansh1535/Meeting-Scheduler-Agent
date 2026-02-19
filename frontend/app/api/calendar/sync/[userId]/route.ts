/**
 * API Route: /api/calendar/sync/[userId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncUserCalendar } from '@/lib/calendarSync'
import { hasValidOAuthConnection } from '@/lib/googleAuth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json().catch(() => ({}))

    const hasValidAuth = await hasValidOAuthConnection(userId)
    if (!hasValidAuth) {
      return NextResponse.json(
        {
          error: 'Not authorized',
          message: 'User has not connected Google Calendar. Please complete OAuth flow first.',
          auth_url: '/api/auth/google/initiate',
        },
        { status: 401 }
      )
    }

    const result = await syncUserCalendar(userId, {
      forceRefresh: body.force_refresh || false,
      skipCompression: body.skip_compression || false,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Sync failed',
          message: result.error || 'Calendar synchronization failed',
          sync_id: result.syncId,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar synchronized successfully',
      sync_id: result.syncId,
      events_fetched: result.eventsFetched,
      events_added: result.eventsAdded,
      events_updated: result.eventsUpdated,
      events_deleted: result.eventsDeleted,
      compression_completed: result.compressionCompleted,
      compression_ratio: result.compressionRatio,
      duration_ms: result.totalDurationMs,
    })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Sync request failed', message: error.message },
      { status: 500 }
    )
  }
}
