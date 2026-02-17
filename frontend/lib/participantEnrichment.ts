/**
 * Participant Enrichment Service
 * 
 * Looks up participants by email and enriches with compressed calendar data.
 * Falls back to mock data if compressed calendar not available.
 */

import { supabase } from './supabase';
import { getCompressedCalendarForUser, generateMockCompressedCalendar } from './compressedCalendarTransformer';
import { Participant } from '@/types/scheduling';

export interface ParticipantLookupResult {
  found: boolean;
  user_id?: string;
  email: string;
  name?: string;
  has_compressed_calendar: boolean;
}

/**
 * Lookup user by email
 */
export async function lookupUserByEmail(email: string): Promise<ParticipantLookupResult> {
  const { data, error } = await supabase
    .from('user_accounts')
    .select('id, email, display_name')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return {
      found: false,
      email,
      has_compressed_calendar: false,
    };
  }

  // Check if user has compressed calendar
  const { data: compressed } = await supabase
    .from('compressed_calendars')
    .select('id')
    .eq('user_id', data.id)
    .eq('is_active', true)
    .single();

  return {
    found: true,
    user_id: data.id,
    email: data.email,
    name: data.display_name || undefined,
    has_compressed_calendar: !!compressed,
  };
}

/**
 * Enrich participants with compressed calendar data
 * 
 * Accepts array of emails, looks up users, fetches compressed calendars,
 * and returns Participant objects ready for Python AI.
 */
export async function enrichParticipantsWithCalendars(
  emails: string[],
  timezone: string = 'UTC'
): Promise<Participant[]> {
  const participants: Participant[] = [];

  for (const email of emails) {
    // Lookup user
    const lookup = await lookupUserByEmail(email);

    let calendarSummary;

    if (lookup.found && lookup.user_id && lookup.has_compressed_calendar) {
      // Use real compressed calendar
      console.log(`📊 Using compressed calendar for ${email}`);
      calendarSummary = await getCompressedCalendarForUser(lookup.user_id, timezone);
    }

    if (!calendarSummary) {
      // Fallback to mock data
      console.warn(`⚠️  No compressed calendar for ${email}, using mock data`);
      calendarSummary = generateMockCompressedCalendar(lookup.user_id || email, timezone);
    }

    participants.push({
      user_id: lookup.user_id || email,
      email: email,
      name: lookup.name || email.split('@')[0],
      is_required: true, // Default: all participants required
      calendar_summary: calendarSummary,
    });
  }

  console.log(`✅ Enriched ${participants.length} participants with calendar data`);
  console.log(`   Real calendars: ${participants.filter(p => p.calendar_summary.data_compressed).length}`);
  console.log(`   Mock calendars: ${participants.filter(p => !p.calendar_summary.data_compressed).length}`);

  return participants;
}

/**
 * Check if all participants have compressed calendars
 */
export async function checkParticipantCalendarStatus(
  emails: string[]
): Promise<{
  total: number;
  with_calendars: number;
  without_calendars: string[];
}> {
  const results = await Promise.all(emails.map(email => lookupUserByEmail(email)));

  const withCalendars = results.filter(r => r.found && r.has_compressed_calendar);
  const withoutCalendars = results.filter(r => !r.found || !r.has_compressed_calendar);

  return {
    total: emails.length,
    with_calendars: withCalendars.length,
    without_calendars: withoutCalendars.map(r => r.email),
  };
}
