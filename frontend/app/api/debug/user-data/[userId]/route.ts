/**
 * API Route: GET /api/debug/user-data/[userId]
 * 
 * DEBUG: Shows all data associated with a user to verify data isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get user account
    const { data: user, error: userError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('id', userId)
      .single();

    // Get OAuth tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('oauth_tokens')
      .select('user_id, provider, expires_at, scopes, created_at')
      .eq('user_id', userId);

    // Get calendar events with their user_id
    const { data: calendarEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .select('id, user_id, google_event_id, title, start_time, end_time')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })
      .limit(20);

    // Get meetings
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, user_id, title, start_time, end_time')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })
      .limit(20);

    // Also check if there are events with OTHER user_ids (potential leak)
    const { data: allEvents, error: allEventsError } = await supabase
      .from('calendar_events')
      .select('user_id, title, count')
      .limit(100);

    // Group by user_id
    const eventsByUser = allEvents?.reduce((acc: any, event: any) => {
      const uid = event.user_id;
      if (!acc[uid]) {
        acc[uid] = [];
      }
      acc[uid].push(event);
      return acc;
    }, {}) || {};

    return NextResponse.json({
      user: {
        id: user?.id,
        email: user?.email,
        display_name: user?.display_name,
        google_user_id: user?.google_user_id,
      },
      oauth_tokens: tokens,
      calendar_events: {
        count: calendarEvents?.length || 0,
        events: calendarEvents,
        user_ids_in_results: [...new Set(calendarEvents?.map(e => e.user_id) || [])],
      },
      meetings: {
        count: meetings?.length || 0,
        events: meetings,
      },
      database_wide_check: {
        total_events_in_db: allEvents?.length || 0,
        events_by_user_id: Object.keys(eventsByUser).map(uid => ({
          user_id: uid,
          count: eventsByUser[uid].length,
          sample_title: eventsByUser[uid][0]?.title,
        })),
      },
      errors: {
        user: userError?.message,
        tokens: tokensError?.message,
        events: eventsError?.message,
        meetings: meetingsError?.message,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Debug user data error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
