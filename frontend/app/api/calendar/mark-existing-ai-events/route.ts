/**
 * Utility Script: Mark Existing AI Platform Events
 * 
 * Run this after applying the source_platform migration to ensure
 * all existing AI Platform events are properly marked in the database.
 * 
 * This is especially useful if you:
 * 1. Already had AI-scheduled events before this feature
 * 2. Want to retroactively mark events without waiting for next sync
 * 3. Need to verify/fix source_platform values
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface MarkExistingEventsResponse {
  success: boolean;
  message: string;
  events_marked: number;
  already_marked: number;
  total_ai_events: number;
  errors?: string[];
}

/**
 * POST /api/calendar/mark-existing-ai-events
 * 
 * Body: { user_id?: string } - Optional, runs for all users if not provided
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.user_id;

    console.log('🔄 Starting retroactive AI Platform event marking...');
    
    let eventsMarked = 0;
    let alreadyMarked = 0;
    const errors: string[] = [];

    // Get all meetings with google_event_id (these are AI Platform events that were written to Google Calendar)
    let meetingsQuery = supabase
      .from('meetings')
      .select('google_event_id, user_id, meeting_id, title')
      .not('google_event_id', 'is', null);

    if (targetUserId) {
      meetingsQuery = meetingsQuery.eq('user_id', targetUserId);
    }

    const { data: aiMeetings, error: fetchError } = await meetingsQuery;

    if (fetchError) {
      return NextResponse.json<MarkExistingEventsResponse>(
        {
          success: false,
          message: 'Failed to fetch AI meetings',
          events_marked: 0,
          already_marked: 0,
          total_ai_events: 0,
          errors: [fetchError.message],
        },
        { status: 500 }
      );
    }

    if (!aiMeetings || aiMeetings.length === 0) {
      return NextResponse.json<MarkExistingEventsResponse>({
        success: true,
        message: 'No AI Platform events found to mark',
        events_marked: 0,
        already_marked: 0,
        total_ai_events: 0,
      });
    }

    console.log(`📊 Found ${aiMeetings.length} AI Platform events to check`);

    // Process each AI meeting
    for (const meeting of aiMeetings) {
      try {
        // Find corresponding calendar event
        const { data: calendarEvent } = await supabase
          .from('calendar_events')
          .select('id, source_platform, title')
          .eq('google_event_id', meeting.google_event_id)
          .single();

        if (!calendarEvent) {
          console.log(`⚠️  No calendar event found for meeting ${meeting.meeting_id} (${meeting.google_event_id})`);
          continue;
        }

        // Check if already marked
        if (calendarEvent.source_platform === 'ai_platform') {
          alreadyMarked++;
          continue;
        }

        // Mark as AI Platform
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({
            source_platform: 'ai_platform',
            updated_at: new Date().toISOString(),
          })
          .eq('id', calendarEvent.id);

        if (updateError) {
          errors.push(`Failed to mark event ${meeting.google_event_id}: ${updateError.message}`);
        } else {
          eventsMarked++;
          console.log(`✅ Marked event as AI Platform: "${calendarEvent.title}" (${meeting.google_event_id})`);
        }
      } catch (error: any) {
        errors.push(`Error processing meeting ${meeting.meeting_id}: ${error.message}`);
      }
    }

    console.log(`✅ Retroactive marking complete:`);
    console.log(`   - Events marked: ${eventsMarked}`);
    console.log(`   - Already marked: ${alreadyMarked}`);
    console.log(`   - Total AI events: ${aiMeetings.length}`);
    console.log(`   - Errors: ${errors.length}`);

    return NextResponse.json<MarkExistingEventsResponse>({
      success: errors.length === 0,
      message: `Successfully marked ${eventsMarked} events. ${alreadyMarked} already marked. ${errors.length} errors.`,
      events_marked: eventsMarked,
      already_marked: alreadyMarked,
      total_ai_events: aiMeetings.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('❌ Retroactive marking failed:', error);
    return NextResponse.json<MarkExistingEventsResponse>(
      {
        success: false,
        message: 'Failed to mark existing AI Platform events',
        events_marked: 0,
        already_marked: 0,
        total_ai_events: 0,
        errors: [error.message],
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/mark-existing-ai-events
 * 
 * Returns statistics without making changes
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('user_id');

    // Get all meetings with google_event_id
    let meetingsQuery = supabase
      .from('meetings')
      .select('google_event_id, user_id')
      .not('google_event_id', 'is', null);

    if (targetUserId) {
      meetingsQuery = meetingsQuery.eq('user_id', targetUserId);
    }

    const { data: aiMeetings } = await meetingsQuery;

    if (!aiMeetings || aiMeetings.length === 0) {
      return NextResponse.json({
        total_ai_events: 0,
        marked_correctly: 0,
        needs_marking: 0,
        not_in_calendar: 0,
      });
    }

    let markedCorrectly = 0;
    let needsMarking = 0;
    let notInCalendar = 0;

    for (const meeting of aiMeetings) {
      const { data: calendarEvent } = await supabase
        .from('calendar_events')
        .select('source_platform')
        .eq('google_event_id', meeting.google_event_id)
        .single();

      if (!calendarEvent) {
        notInCalendar++;
      } else if (calendarEvent.source_platform === 'ai_platform') {
        markedCorrectly++;
      } else {
        needsMarking++;
      }
    }

    return NextResponse.json({
      total_ai_events: aiMeetings.length,
      marked_correctly: markedCorrectly,
      needs_marking: needsMarking,
      not_in_calendar: notInCalendar,
      message: needsMarking > 0 
        ? `${needsMarking} events need to be marked. Run POST request to fix.`
        : 'All AI Platform events are correctly marked!',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check statistics', message: error.message },
      { status: 500 }
    );
  }
}
