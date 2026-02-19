/**
 * Google Calendar API Client
 * 
 * Fetches calendar events from Google Calendar API.
 * Caches events in Supabase to minimize API calls.
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabase, supabaseAdmin } from './supabase'; // Admin for writes, anon for reads
import { getAuthenticatedClient } from './googleAuth';

export interface CalendarEvent {
  google_event_id: string;
  google_calendar_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  timezone: string;
  is_all_day: boolean;
  status: string;
  visibility: string;
  attendee_count: number;
  is_organizer: boolean;
  response_status: string | null;
  is_recurring: boolean;
  recurring_event_id: string | null;
  raw_event: any;
}

export interface FetchEventsOptions {
  calendarId?: string; // Default: 'primary'
  timeMin?: Date; // Default: 12 months ago
  timeMax?: Date; // Default: 12 months ahead
  maxResults?: number; // Per page, default: 250
  singleEvents?: boolean; // Expand recurring events, default: true
}

/**
 * Fetch calendar events from Google Calendar API
 * 
 * By default, fetches 12 months of calendar history for ScaleDown compression.
 */
export async function fetchCalendarEvents(
  userId: string,
  options: FetchEventsOptions = {}
): Promise<CalendarEvent[]> {
  const {
    calendarId = 'primary',
    timeMin = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 12 months ago
    timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 months ahead
    maxResults = 250,
    singleEvents = true,
  } = options;

  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const allEvents: CalendarEvent[] = [];
  let pageToken: string | undefined = undefined;
  let apiCallCount = 0;

  do {
    apiCallCount++;
    console.log(`Fetching calendar events (page ${apiCallCount}) for user ${userId}...`);

    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults,
      singleEvents,
      orderBy: singleEvents ? 'startTime' : undefined,
      pageToken,
    });

    const items = response.data.items || [];
    
    for (const event of items) {
      const parsedEvent = parseGoogleEvent(event, calendarId);
      if (parsedEvent) {
        allEvents.push(parsedEvent);
      }
    }

    pageToken = response.data.nextPageToken || undefined;
    
    // Safety limit: prevent infinite loops
    if (apiCallCount > 100) {
      console.warn(`API call limit reached (${apiCallCount} calls). Stopping pagination.`);
      break;
    }
  } while (pageToken);

  console.log(`✅ Fetched ${allEvents.length} events from Google Calendar (${apiCallCount} API calls)`);

  return allEvents;
}

/**
 * Parse Google Calendar event to our format
 */
function parseGoogleEvent(
  event: calendar_v3.Schema$Event,
  calendarId: string
): CalendarEvent | null {
  if (!event.id || !event.start || !event.end) {
    return null; // Skip events without required fields
  }

  // Handle all-day events
  const isAllDay = !!event.start.date;
  const startTime = event.start.dateTime || event.start.date!;
  const endTime = event.end.dateTime || event.end.date!;
  const timezone = event.start.timeZone || event.end.timeZone || 'UTC';

  // Get attendee info
  const attendees = event.attendees || [];
  const attendeeCount = attendees.length;
  const userEmail = event.organizer?.email || '';
  const isOrganizer = event.organizer?.self || false;
  const selfAttendee = attendees.find(a => a.self);
  const responseStatus = selfAttendee?.responseStatus || null;

  return {
    google_event_id: event.id,
    google_calendar_id: calendarId,
    title: event.summary || '(No title)',
    description: event.description || null,
    location: event.location || null,
    start_time: startTime,
    end_time: endTime,
    timezone,
    is_all_day: isAllDay,
    status: event.status || 'confirmed',
    visibility: event.visibility || 'default',
    attendee_count: attendeeCount,
    is_organizer: isOrganizer,
    response_status: responseStatus,
    is_recurring: !!event.recurringEventId,
    recurring_event_id: event.recurringEventId || null,
    raw_event: event,
  };
}

/**
 * Store calendar events in Supabase database
 * ALSO deletes events that no longer exist in Google Calendar
 */
export async function storeCalendarEvents(
  userId: string,
  events: CalendarEvent[]
): Promise<{ added: number; updated: number; deleted: number }> {
  let added = 0;
  let updated = 0;

  // Get list of current google_event_ids
  const currentEventIds = events.map(e => e.google_event_id);

  // Process in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    for (const event of batch) {
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', userId)
        .eq('google_event_id', event.google_event_id)
        .single();

      if (existing) {
        // Update existing event
        const { error } = await supabase
          .from('calendar_events')
          .update({
            google_calendar_id: event.google_calendar_id,
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.start_time,
            end_time: event.end_time,
            timezone: event.timezone,
            is_all_day: event.is_all_day,
            status: event.status,
            visibility: event.visibility,
            attendee_count: event.attendee_count,
            is_organizer: event.is_organizer,
            response_status: event.response_status,
            is_recurring: event.is_recurring,
            recurring_event_id: event.recurring_event_id,
            raw_event: event.raw_event,
            synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (!error) updated++;
      } else {
        // Insert new event
        const { error } = await supabase
          .from('calendar_events')
          .insert({
            user_id: userId,
            google_event_id: event.google_event_id,
            google_calendar_id: event.google_calendar_id,
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.start_time,
            end_time: event.end_time,
            timezone: event.timezone,
            is_all_day: event.is_all_day,
            status: event.status,
            visibility: event.visibility,
            attendee_count: event.attendee_count,
            is_organizer: event.is_organizer,
            response_status: event.response_status,
            is_recurring: event.is_recurring,
            recurring_event_id: event.recurring_event_id,
            raw_event: event.raw_event,
            synced_at: new Date().toISOString(),
          });

        if (!error) added++;
      }
    }

    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} events`);
  }

  // DELETE events that no longer exist in Google Calendar
  let deleted = 0;
  if (currentEventIds.length > 0) {
    const { data: deletedEvents, error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .not('google_event_id', 'in', `(${currentEventIds.join(',')})`)
      .select('id');

    if (!deleteError && deletedEvents) {
      deleted = deletedEvents.length;
    }
  } else {
    // If no events from Google, delete all events for this user
    const { data: deletedEvents, error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (!deleteError && deletedEvents) {
      deleted = deletedEvents.length;
    }
  }

  console.log(`✅ Stored events: ${added} added, ${updated} updated, ${deleted} deleted`);

  return { added, updated, deleted };
}

/**
 * Get cached calendar events for user
 */
export async function getCachedCalendarEvents(
  userId: string,
  options: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const { startTime, endTime, limit } = options;

  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (startTime) {
    query = query.gte('start_time', startTime.toISOString());
  }

  if (endTime) {
    query = query.lte('end_time', endTime.toISOString());
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(row => ({
    google_event_id: row.google_event_id,
    google_calendar_id: row.google_calendar_id,
    title: row.title,
    description: row.description,
    location: row.location,
    start_time: row.start_time,
    end_time: row.end_time,
    timezone: row.timezone,
    is_all_day: row.is_all_day,
    status: row.status,
    visibility: row.visibility,
    attendee_count: row.attendee_count,
    is_organizer: row.is_organizer,
    response_status: row.response_status,
    is_recurring: row.is_recurring,
    recurring_event_id: row.recurring_event_id,
    raw_event: row.raw_event,
  }));
}

/**
 * Delete old cached events (cleanup)
 */
export async function deleteOldCachedEvents(
  userId: string,
  olderThan: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .lt('end_time', olderThan.toISOString())
    .select('id');

  if (error) throw error;

  const deletedCount = data?.length || 0;
  console.log(`🗑️  Deleted ${deletedCount} old calendar events`);

  return deletedCount;
}
