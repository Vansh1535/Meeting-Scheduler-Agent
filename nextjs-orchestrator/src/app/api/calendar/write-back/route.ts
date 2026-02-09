/**
 * Next.js API Route: /api/calendar/write-back
 * 
 * Stage 5: Calendar Write-Back
 * Creates Google Calendar events from AI scheduling decisions.
 * 
 * POST /api/calendar/write-back
 * Body: { meeting_id: string } OR { batch: true, limit?: number }
 * 
 * Use Cases:
 * 1. Single write-back: After AI scheduling completes
 * 2. Batch processing: Retry failed write-backs or process pending meetings
 * 3. Scheduled jobs: Cron job to process queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createCalendarEvent, processPendingWritebacks, type CalendarEventInput } from '@/lib/googleCalendarWrite';

interface WriteBackRequest {
  meeting_id?: string;
  user_id?: string; // Required for single write-back
  batch?: boolean;
  limit?: number;
}

interface WriteBackResponse {
  success: boolean;
  message: string;
  results?: Array<{
    meeting_id: string;
    success: boolean;
    google_event_id?: string;
    google_event_link?: string;
    error?: string;
    already_exists?: boolean;
  }>;
  total_processed?: number;
  succeeded?: number;
  failed?: number;
}

interface ErrorResponse {
  error: string;
  message: string;
  status: number;
}

/**
 * POST /api/calendar/write-back
 * 
 * Single meeting: { "meeting_id": "abc-123" }
 * Batch process: { "batch": true, "limit": 10 }
 */
export async function POST(request: NextRequest) {
  try {
    const body: WriteBackRequest = await request.json();

    // Batch processing mode
    if (body.batch) {
      const limit = body.limit || 10;
      console.log(`🔄 Processing batch write-back (limit: ${limit})...`);

      const results = await processPendingWritebacks(limit);

      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return NextResponse.json<WriteBackResponse>({
        success: true,
        message: `Processed ${results.length} pending write-backs`,
        total_processed: results.length,
        succeeded,
        failed,
        results: results.map((r, i) => ({
          meeting_id: `meeting_${i}`, // Batch mode doesn't return meeting_id directly
          success: r.success,
          google_event_id: r.google_event_id,
          google_event_link: r.google_event_link,
          error: r.error,
          already_exists: r.already_exists,
        })),
      });
    }

    // Single meeting mode
    const { meeting_id, user_id } = body;

    if (!meeting_id) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'Missing required field: meeting_id',
          status: 400,
        },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'Missing required field: user_id (Google Calendar account)',
          status: 400,
        },
        { status: 400 }
      );
    }

    console.log(`📅 Write-back requested for meeting: ${meeting_id}`);

    // Step 1: Fetch meeting from database
    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*')
      .eq('meeting_id', meeting_id)
      .single();

    if (fetchError || !meeting) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Meeting not found',
          message: `No meeting found with ID: ${meeting_id}`,
          status: 404,
        },
        { status: 404 }
      );
    }

    // Step 2: Validate meeting has a selected slot
    if (!meeting.selected_slot) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid meeting state',
          message: 'Meeting has no selected slot. Run AI scheduling first.',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Step 3: Extract data for event creation
    const selectedSlot = meeting.selected_slot;
    const participants = meeting.participants || [];
    const constraints = meeting.constraints || {};

    // Build event summary
    const participantNames = participants
      .map((p: any) => p.name || p.email)
      .filter(Boolean)
      .join(', ');

    const summary = `AI-Scheduled Meeting: ${participantNames}`;

    // Build event description with AI reasoning
    const aiScore = selectedSlot.score || 'N/A';
    const aiReasoning = selectedSlot.reasoning || 'No reasoning provided';
    const description = `
🤖 AI-Scheduled Meeting

Score: ${aiScore}/100
${aiReasoning}

Participants:
${participants.map((p: any) => `- ${p.name || p.email} (${p.email})`).join('\n')}

Duration: ${constraints.duration_minutes || 30} minutes
Timezone: ${constraints.timezone || 'UTC'}

Scheduled by Meeting Scheduler AI
Meeting ID: ${meeting_id}
    `.trim();

    // Extract attendee emails
    const attendees = participants
      .map((p: any) => p.email)
      .filter(Boolean);

    if (attendees.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid meeting state',
          message: 'Meeting has no participants with email addresses',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Step 5: Create calendar event
    const input: CalendarEventInput = {
      meeting_id,
      organizer_user_id: user_id, // Use provided user_id instead of meeting.organizer_user_id
      summary,
      description,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      timezone: constraints.timezone || 'UTC',
      attendees,
    };

    const result = await createCalendarEvent(input);

    if (result.success) {
      return NextResponse.json<WriteBackResponse>({
        success: true,
        message: result.already_exists
          ? 'Calendar event already exists'
          : 'Calendar event created successfully',
        results: [{
          meeting_id,
          success: true,
          google_event_id: result.google_event_id,
          google_event_link: result.google_event_link,
          already_exists: result.already_exists,
        }],
        total_processed: 1,
        succeeded: 1,
        failed: 0,
      });
    } else {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Write-back failed',
          message: result.error || 'Unknown error',
          status: 500,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Write-back API error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        status: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/write-back
 * 
 * Query params: ?meeting_id=abc-123
 * Returns write-back status for a meeting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const meeting_id = searchParams.get('meeting_id');

    if (!meeting_id) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'Missing query parameter: meeting_id',
          status: 400,
        },
        { status: 400 }
      );
    }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('meeting_id, writeback_status, google_event_id, google_event_link, writeback_error, writeback_retry_count, writeback_attempted_at, writeback_succeeded_at')
      .eq('meeting_id', meeting_id)
      .single();

    if (error || !meeting) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Meeting not found',
          message: `No meeting found with ID: ${meeting_id}`,
          status: 404,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      meeting_id: meeting.meeting_id,
      status: meeting.writeback_status,
      google_event_id: meeting.google_event_id,
      google_event_link: meeting.google_event_link,
      error: meeting.writeback_error,
      retry_count: meeting.writeback_retry_count,
      last_attempted: meeting.writeback_attempted_at,
      succeeded_at: meeting.writeback_succeeded_at,
    });

  } catch (error: any) {
    console.error('❌ Write-back status check error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        status: 500,
      },
      { status: 500 }
    );
  }
}
