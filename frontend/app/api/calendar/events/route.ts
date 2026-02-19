/**
 * API Route: /api/calendar/events
 * 
 * Gets user's calendar events from database
 * Returns real events synced from Google Calendar (if available)
 * or mock data for testing purposes
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ErrorResponse {
  error: string
  message: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Reduce console spam - only log errors

    if (!userId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Missing userId',
          message: 'userId query parameter is required',
        },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    // Add date filters if provided
    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('start_time', endDate)
    }

    const { data: events, error: fetchError } = await query

    if (fetchError) {
      console.error('❌ Failed to fetch events from Supabase:', fetchError)
      // Return empty array as fallback
      return NextResponse.json([])
    }

    // Silent polling

    // Transform to frontend format
    const transformedEvents = (events || []).map((event: any) => {
      // Use source_platform from database if available, fallback to checking meetings table
      const source = event.source_platform || 'google'
      
      // Extract attendees from raw_event if available
      const attendees = event.raw_event?.attendees || []
      const attendeeList = attendees.map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName || attendee.email?.split('@')[0] || 'Unknown',
        is_required: !attendee.optional,
        responseStatus: attendee.responseStatus,
        organizer: attendee.organizer || false,
      }))

      return {
        id: event.id,
        title: event.title,
        summary: event.title,
        description: event.description,
        category: event.status || 'Meeting',
        startTime: event.start_time,
        endTime: event.end_time,
        location: event.location,
        timezone: event.timezone,
        attendeeCount: event.attendee_count,
        isOrganizer: event.is_organizer,
        source: source === 'ai_platform' ? 'ai' : 'google', // Use database source_platform field
        google_event_id: event.google_event_id, // Keep google_event_id for linking
        attendees: attendeeList,
        google_event_link: event.raw_event?.hangoutLink || event.raw_event?.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri,
      }
    })

    return NextResponse.json(transformedEvents)
  } catch (error: any) {
    console.error('❌ Calendar events error:', error)
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to fetch events',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
