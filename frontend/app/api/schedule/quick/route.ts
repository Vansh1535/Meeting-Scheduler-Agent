/**
 * API Route: /api/schedule/quick
 * Accepts simplified scheduling requests from the frontend.
 * Creates calendar events directly without multi-participant analysis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/googleCalendarWrite'

interface QuickScheduleRequest {
  userId: string
  title: string
  description?: string
  duration: number
  category?: string
  preferredDate: string
  preferredTime: string
  priority?: string
  flexibility?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: QuickScheduleRequest = await request.json()

    if (!body.userId || !body.title || !body.preferredDate || !body.preferredTime) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('user_accounts')
      .select('email')
      .eq('id', body.userId)
      .single()

    if (userError || !user?.email) {
      console.error('User lookup failed:', userError, 'userId:', body.userId)
      return NextResponse.json(
        { error: 'User not found', message: 'Invalid userId' },
        { status: 404 }
      )
    }

    // Create event directly in database
    const startDateTime = new Date(`${body.preferredDate}T${body.preferredTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + body.duration * 60000)
    const eventId = `ai-quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Compulsory AI description
    const aiSignature = '\n\n---\nThis event was created by AI Event Scheduler'
    const finalDescription = body.description
      ? `${body.description}${aiSignature}`
      : `This event was created by AI Event Scheduler`

    const { data: newEvent, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: body.userId,
        google_event_id: eventId,
        google_calendar_id: 'primary',
        title: body.title,
        description: finalDescription,
        location: '',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        is_all_day: false,
        status: body.category || 'confirmed',
        visibility: 'default',
        attendee_count: 1,
        is_organizer: true,
        response_status: 'accepted',
        is_recurring: false,
        source_platform: 'ai_platform',
        raw_event: {
          source: 'quick_schedule',
          category: body.category,
          priority: body.priority,
          flexibility: body.flexibility,
        },
        synced_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (eventError) {
      console.error('Failed to create calendar event:', eventError)
      return NextResponse.json(
        { error: 'Failed to create event', message: eventError.message },
        { status: 500 }
      )
    }

    console.log('✅ Quick schedule event created:', newEvent.id)

    // Write to Google Calendar so the event appears and invites are sent
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const gcalResult = await createCalendarEvent({
      meeting_id: newEvent.id,
      organizer_user_id: body.userId,
      summary: body.title,
      description: finalDescription,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      timezone,
      attendees: user.email ? [user.email] : [],
      send_updates: 'all',
    })

    if (!gcalResult.success) {
      console.warn('⚠️  Google Calendar write-back failed (event saved to DB):', gcalResult.error)
    } else {
      await supabase.from('calendar_events').update({
        google_event_id: gcalResult.google_event_id,
      }).eq('id', newEvent.id)
      console.log('📅 Event written to Google Calendar:', gcalResult.html_link)
    }

    return NextResponse.json({
      success: true,
      event: {
        id: newEvent.id,
        title: newEvent.title,
        startTime: newEvent.start_time,
        endTime: newEvent.end_time,
        source: 'ai',
      },
      message: 'Event created successfully',
    })
  } catch (error: any) {
    console.error('Quick schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule', message: error.message },
      { status: 500 }
    )
  }
}
