/**
 * API Route: /api/calendar/create-ai-event
 * Creates a calendar event from AI analysis results
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

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

    // Prepare raw event metadata
    const rawEvent = {
      source: 'ai_analysis',
      aiScore: body.aiScore,
      aiReasoning: body.aiReasoning,
      participantEmails: body.participantEmails,
      createdAt: new Date().toISOString(),
    }

    // Insert calendar event
    const { data: newEvent, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: body.userId,
        google_event_id: eventId,
        google_calendar_id: 'primary',
        title: body.title,
        description: body.description || '',
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
