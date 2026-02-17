/**
 * Google Calendar Write Service
 * 
 * Creates calendar events from AI scheduling decisions.
 * Handles timezone conversion, attendee invites, and idempotency.
 */

import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient } from './googleAuth';
import { supabase } from './supabase';

export interface CalendarEventInput {
  meeting_id: string;
  organizer_user_id: string;
  summary: string; // Event title
  description?: string; // AI reasoning, participant names, etc.
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  timezone: string;
  attendees: string[]; // Email addresses
  calendar_id?: string; // Default: 'primary'
  send_updates?: 'all' | 'externalOnly' | 'none'; // Default: 'all'
}

export interface CalendarEventResult {
  success: boolean;
  google_event_id?: string;
  google_calendar_id?: string;
  google_event_link?: string;
  html_link?: string;
  error?: string;
  already_exists?: boolean;
}

/**
 * Create a Google Calendar event from AI scheduling decision
 * 
 * Features:
 * - Idempotency: Checks if event already exists
 * - Timezone-aware start/end times
 * - Automatic attendee invites
 * - Rich description with AI context
 * - Error handling and retry support
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarEventResult> {
  const {
    meeting_id,
    organizer_user_id,
    summary,
    description,
    start_time,
    end_time,
    timezone,
    attendees,
    calendar_id = 'primary',
    send_updates = 'all',
  } = input;

  try {
    // Step 1: Check idempotency - has this meeting already been created?
    const { data: existingMeeting } = await supabase
      .from('meetings')
      .select('google_event_id, google_event_link')
      .eq('meeting_id', meeting_id)
      .single();

    if (existingMeeting?.google_event_id) {
      console.log(`✅ Event already exists for meeting ${meeting_id}: ${existingMeeting.google_event_id}`);
      return {
        success: true,
        google_event_id: existingMeeting.google_event_id,
        google_event_link: existingMeeting.google_event_link || undefined,
        already_exists: true,
      };
    }

    // Step 2: Get authenticated Google Calendar client
    const oauth2Client = await getAuthenticatedClient(organizer_user_id);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Step 3: Prepare event data
    const eventData: calendar_v3.Schema$Event = {
      summary,
      description,
      start: {
        dateTime: start_time,
        timeZone: timezone,
      },
      end: {
        dateTime: end_time,
        timeZone: timezone,
      },
      attendees: attendees.map(email => ({
        email,
        responseStatus: 'needsAction',
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${meeting_id}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
    };

    console.log(`📅 Creating Google Calendar event for meeting ${meeting_id}...`);
    console.log(`   Time: ${start_time} to ${end_time} (${timezone})`);
    console.log(`   Attendees: ${attendees.join(', ')}`);

    // Step 4: Create the event
    const response = await calendar.events.insert({
      calendarId: calendar_id,
      requestBody: eventData,
      sendUpdates: send_updates,
      conferenceDataVersion: 1, // Enable Google Meet
    });

    const event = response.data;

    if (!event.id) {
      throw new Error('Google Calendar API returned no event ID');
    }

    console.log(`✅ Calendar event created: ${event.id}`);
    console.log(`   Link: ${event.htmlLink}`);

    // Step 5: Update database with success
    await supabase.rpc('mark_writeback_success', {
      p_meeting_id: meeting_id,
      p_google_event_id: event.id,
      p_google_calendar_id: calendar_id,
      p_google_event_link: event.htmlLink || null,
    });

    return {
      success: true,
      google_event_id: event.id,
      google_calendar_id: calendar_id,
      google_event_link: event.htmlLink || undefined,
      html_link: event.htmlLink || undefined,
    };

  } catch (error: any) {
    console.error(`❌ Failed to create calendar event for meeting ${meeting_id}:`, error);

    const errorMessage = error.message || 'Unknown error';
    const shouldRetry = !errorMessage.includes('invalid_grant') && !errorMessage.includes('404');

    // Update database with failure
    await supabase.rpc('mark_writeback_failure', {
      p_meeting_id: meeting_id,
      p_error_message: errorMessage,
      p_should_retry: shouldRetry,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch create calendar events for multiple meetings
 * Returns array of results with successes and failures
 */
export async function createCalendarEventsBatch(
  inputs: CalendarEventInput[]
): Promise<CalendarEventResult[]> {
  const results: CalendarEventResult[] = [];

  for (const input of inputs) {
    try {
      const result = await createCalendarEvent(input);
      results.push(result);
    } catch (error: any) {
      results.push({
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log(`📊 Batch write-back complete: ${successCount} succeeded, ${failureCount} failed`);

  return results;
}

/**
 * Process pending write-backs from database
 * Useful for retry jobs or scheduled tasks
 * 
 * Note: This function requires meetings to have user context.
 * For now, it's disabled. Use single write-back with explicit user_id instead.
 */
export async function processPendingWritebacks(limit: number = 10): Promise<CalendarEventResult[]> {
  console.warn('⚠️  Batch write-back not fully implemented - requires user_id mapping');
  console.warn('   Use single write-back with explicit user_id parameter instead');
  return [];
  
  /* Disabled until we add user_id mapping to meetings table
  const { data: pendingMeetings, error } = await supabase.rpc('get_pending_writebacks', {
    p_limit: limit,
  });

  if (error || !pendingMeetings) {
    console.error('Failed to fetch pending write-backs:', error);
    return [];
  }

  console.log(`🔄 Processing ${pendingMeetings.length} pending write-backs...`);

  const inputs: CalendarEventInput[] = pendingMeetings.map((meeting: any) => {
    const slot = meeting.selected_slot;
    const participants = meeting.participants || [];

    return {
      meeting_id: meeting.meeting_id,
      organizer_user_id: meeting.organizer_user_id, // This field doesn't exist
      summary: slot.summary || `Meeting ${meeting.meeting_id}`,
      description: slot.reasoning || 'AI-scheduled meeting',
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: meeting.constraints?.timezone || 'UTC',
      attendees: participants.map((p: any) => p.email).filter(Boolean),
    };
  });

  return await createCalendarEventsBatch(inputs);
  */
}
