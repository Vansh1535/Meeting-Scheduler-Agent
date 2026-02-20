/**
 * API Route: /api/calendar/create-ai-event
 * Creates a calendar event from AI analysis results
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/googleCalendarWrite'

interface CreateAIEventRequest {
  userId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  participantEmails: string[]
  aiScore: number
  aiReasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAIEventRequest = await request.json()

    // Validate required fields
    if (!body.userId || !body.title || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user email
    const { data: user, error: userError } = await supabase
      .from('user_accounts')
      .select('email')
      .eq('id', body.userId)
      .single()

    if (userError || !user) {
      console.error('User lookup failed:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create unique event ID
    const eventId = `ai-scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Compulsory AI description
    const aiSignature = '\n\n---\nThis event was created by AI Event Scheduler'
    const finalDescription = body.description
      ? `${body.description}${aiSignature}`
      : `AI-scheduled meeting (Score: ${body.aiScore?.toFixed(1) ?? 'N/A'}/100)\n\nReasoning: ${body.aiReasoning || 'Optimal time slot selected by AI'}${aiSignature}`

    // Prepare raw event metadata
    const rawEvent = {
      source: 'ai_analysis',
      aiScore: body.aiScore,
      aiReasoning: body.aiReasoning,
      participantEmails: body.participantEmails,
      createdAt: new Date().toISOString(),
    }

    // Insert calendar event
    const { data: newEvent, error: insertError } = await (supabase as any)
      .from('calendar_events')
      .insert({
        user_id: body.userId,
        google_event_id: eventId,
        google_calendar_id: 'primary',
        title: body.title,
        description: finalDescription,
        location: '',
        start_time: body.startTime,
        end_time: body.endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        is_all_day: false,
        status: 'confirmed',
        visibility: 'default',
        attendee_count: body.participantEmails.length,
        is_organizer: true,
        response_status: 'accepted',
        is_recurring: false,
        source_platform: 'ai_platform',
        raw_event: rawEvent,
        synced_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create calendar event:', insertError)
      return NextResponse.json(
        { error: 'Failed to create event', message: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ AI-scheduled event created:', newEvent.id, '-', body.title)

    // Write to Google Calendar so attendees receive invite emails
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const gcalResult = await createCalendarEvent({
      meeting_id: newEvent.id, // use DB row id as idempotency key
      organizer_user_id: body.userId,
      summary: body.title,
      description: finalDescription,
      start_time: body.startTime,
      end_time: body.endTime,
      timezone,
      attendees: body.participantEmails || [],
      send_updates: 'all', // Google sends invite emails automatically
    })

    if (!gcalResult.success) {
      console.warn('⚠️  Google Calendar write-back failed (event saved to DB):', gcalResult.error)
    } else {
      // Update DB row with the real Google Calendar event ID and link
      await (supabase as any).from('calendar_events').update({
        google_event_id: gcalResult.google_event_id,
        raw_event: { ...rawEvent, google_event_link: gcalResult.html_link },
      }).eq('id', newEvent.id)
      console.log('📧 Google Calendar invite sent to:', body.participantEmails?.join(', '))
    }

    return NextResponse.json({
      success: true,
      event: {
        id: newEvent.id,
        title: newEvent.title,
        startTime: newEvent.start_time,
        endTime: newEvent.end_time,
        source: 'ai',
        aiScore: body.aiScore,
      },
      message: 'Event created successfully',
    })
  } catch (error: any) {
    console.error('Create AI event error:', error)
    return NextResponse.json(
      { error: 'Failed to create event', message: error.message },
      { status: 500 }
    )
  }
}
