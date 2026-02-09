/**
 * Test Endpoint: /api/calendar/write-back/test
 * 
 * Simple test for Google Calendar write functionality
 * Bypasses database - accepts event data directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, type CalendarEventInput } from '@/lib/googleCalendarWrite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      user_id,
      summary = "Test Event from AI Scheduler",
      description = "This is a test event",
      start_time,
      end_time,
      timezone = "America/New_York",
      attendees = [],
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing start_time or end_time" },
        { status: 400 }
      );
    }

    // Create test event
    const input: CalendarEventInput = {
      meeting_id: `test-${Date.now()}`,
      organizer_user_id: user_id,
      summary,
      description,
      start_time,
      end_time,
      timezone,
      attendees,
    };

    console.log('🧪 Test write-back:', input);

    const result = await createCalendarEvent(input);

    if (result.success) {
      return NextResponse.json({
        success: true,
        google_event_id: result.google_event_id,
        google_event_link: result.google_event_link,
        html_link: result.html_link,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test write-back error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
