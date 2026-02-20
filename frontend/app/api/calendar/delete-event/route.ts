/**
 * API Route: DELETE /api/calendar/delete-event
 * 
 * Deletes a calendar event from the database.
 * For AI Platform events, removes from calendar_events table.
 * For Google Calendar events, marks as deleted (requires separate Google API call).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

interface DeleteEventRequest {
  eventId: string;
  reason?: string;
  notifyAttendees?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteEventRequest = await request.json();
    const { eventId, reason, notifyAttendees } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    // First, fetch the event to check its source
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    // Delete the event from database
    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('Failed to delete event:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete event', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Deleted event: ${eventId}`, {
      title: event.title || event.summary,
      source: event.source_platform,
      reason,
      notifyAttendees,
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
      eventId,
      source_platform: event.source_platform,
    });

  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
