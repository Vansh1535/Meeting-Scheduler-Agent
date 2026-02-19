/**
 * API Route: Fetch AI-scheduled meetings
 * GET /api/meetings - Returns meetings from the meetings table
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Reduce console spam - only log errors

    // Build query - use LEFT join to include meetings even without candidates
    // Filter by user_id for data isolation
    let query = supabase
      .from('meetings')
      .select(`
        id,
        meeting_id,
        requested_at,
        participant_count,
        duration_minutes,
        earliest_date,
        latest_date,
        success,
        status,
        selected_candidate_id,
        google_event_id,
        meeting_candidates(
          slot_start,
          slot_end,
          final_score,
          rank
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .order('earliest_date', { ascending: true });

    // Add date filters if provided
    if (startDate) {
      query = query.gte('earliest_date', startDate);
    }
    if (endDate) {
      query = query.lte('earliest_date', endDate);
    }

    const { data: meetings, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Failed to fetch meetings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch meetings', details: fetchError.message },
        { status: 500 }
      );
    }

    // Silent polling - no logs to reduce terminal spam

    return NextResponse.json({
      meetings: meetings || [],
      count: meetings?.length || 0,
    });
  } catch (error: any) {
    console.error('❌ Error in /api/meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
