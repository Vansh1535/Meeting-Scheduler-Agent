/**
 * API Route: /api/calendar/write/[userId]
 * Creates a calendar event directly from event data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCalendarEvent } from '@/lib/googleCalendarWrite'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()

    if (!body?.summary || !body?.start_time || !body?.end_time) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'summary, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    const result = await createCalendarEvent({
      meeting_id: body.meeting_id || `manual-${Date.now()}`,
      organizer_user_id: userId,
      summary: body.summary,
      description: body.description,
      start_time: body.start_time,
      end_time: body.end_time,
      timezone: body.timezone || 'UTC',
      attendees: body.attendees || [],
      calendar_id: body.calendar_id,
      send_updates: body.send_updates,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Write-back failed', message: result.error || 'Failed to create event' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Calendar write error:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event', message: error.message },
      { status: 500 }
    )
  }
}
