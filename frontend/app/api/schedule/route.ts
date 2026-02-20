/**
 * Next.js API Route: /api/schedule
 * 
 * Orchestration layer that forwards scheduling requests to the Python AI Brain.
 * 
 * Stage 4 Enhancement: Now supports real Google Calendar data!
 * - Accept participant emails → Lookup compressed calendars from Supabase
 * - Transform compressed data → Python AI format
 * - Forward enriched request to Python AI Brain
 * - Python AI remains unchanged
 * 
 * Responsibilities:
 * - Accept POST requests (with participant_emails OR participants)
 * - Enrich participants with real compressed calendar data
 * - Forward to Python FastAPI service
 * - Persist AI outputs to Supabase (if enabled)
 * - Handle errors and timeouts
 * - Return AI response unchanged
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ScheduleRequest, ScheduleResponse, ErrorResponse } from '@/types/scheduling';
import type { ScheduleRequestWithEmails } from '@/types/scheduleRequest';
import { persistSchedulingSession } from '@/lib/schedulingPersistence';
import { isDatabaseEnabled, supabaseAdmin } from '@/lib/supabase';
import { enrichParticipantsWithCalendars, checkParticipantCalendarStatus } from '@/lib/participantEnrichment';
import { applyEnforcementRules, type EnforcementContext, type CandidateSlot } from '@/lib/schedulingEnforcement';

// Configuration
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);

/**
 * POST /api/schedule
 * 
 * Accepts two formats:
 * 1. Legacy: { meeting_id, participants: [...], constraints }
 * 2. New (Stage 4): { meeting_id, participant_emails: [...], constraints }
 * 
 * New format automatically fetches compressed calendars from Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ScheduleRequestWithEmails = await request.json();

    // Basic validation
    if (!body.meeting_id || !body.constraints) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'Missing required fields: meeting_id or constraints',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Determine format and enrich participants if needed
    let enrichedRequest: ScheduleRequest;

    if (body.participant_emails && body.participant_emails.length > 0) {
      // New format: Enrich participants with compressed calendars
      console.log(`📧 Stage 4: Enriching ${body.participant_emails.length} participants with real calendar data...`);

      // Check calendar status for informational purposes
      const calendarStatus = await checkParticipantCalendarStatus(body.participant_emails);
      
      if (calendarStatus.without_calendars.length > 0) {
        console.warn(`⚠️  ${calendarStatus.without_calendars.length} participants missing compressed calendars:`);
        console.warn(`   ${calendarStatus.without_calendars.join(', ')}`);
        console.warn(`   Using mock data as fallback.`);
      }

      // Enrich participants with compressed calendar data
      const enrichedParticipants = await enrichParticipantsWithCalendars(
        body.participant_emails,
        body.constraints.timezone
      );

      // Fetch holiday dates from Supabase to exclude from AI scheduling
      let holiday_dates: string[] = [];
      try {
        if (body.userId && body.constraints?.earliest_date && body.constraints?.latest_date) {
          const { data: holidayEvents } = await (supabaseAdmin as any)
            .from('calendar_events')
            .select('start_time')
            .eq('user_id', body.userId)
            .ilike('google_calendar_id', '%holiday%')
            .gte('start_time', body.constraints.earliest_date)
            .lte('start_time', body.constraints.latest_date);
          if (holidayEvents) {
            const seen = new Set<string>();
            for (const e of holidayEvents) {
              const d = (e.start_time as string).slice(0, 10);
              seen.add(d);
            }
            holiday_dates = Array.from(seen);
          }
          if (holiday_dates.length > 0) {
            console.log(`🎉 Excluding ${holiday_dates.length} holiday date(s) from scheduling: ${holiday_dates.join(', ')}`);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch holiday dates (non-fatal):', err);
      }

      enrichedRequest = {
        meeting_id: body.meeting_id,
        participants: enrichedParticipants,
        constraints: { ...body.constraints, holiday_dates },
        preferences: body.preferences,
      };

      console.log(`✅ Enriched request with ${enrichedParticipants.length} participants`);
      console.log(`   Real calendars: ${enrichedParticipants.filter(p => p.calendar_summary.data_compressed).length}`);
      console.log(`   Mock calendars: ${enrichedParticipants.filter(p => !p.calendar_summary.data_compressed).length}`);

    } else if (body.participants && body.participants.length > 0) {
      // Legacy format: Use provided participants
      console.log(`📝 Legacy format: Using ${body.participants.length} provided participants`);

      enrichedRequest = body as ScheduleRequest;

    } else {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'Either participant_emails or participants must be provided',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Forward request to Python AI Brain with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedRequest), // Send enriched request to Python
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses from Python service
    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({
        detail: 'Unknown error from AI service',
      }));

      return NextResponse.json<ErrorResponse>(
        {
          error: 'AI service error',
          message: errorData.detail || 'Failed to process scheduling request',
          status: pythonResponse.status,
        },
        { status: pythonResponse.status }
      );
    }

    // Get AI response
    const aiResponse: ScheduleResponse = await pythonResponse.json();
    
    // ============================================================================
    // STAGE 6: ENFORCEMENT LAYER
    // Apply scheduling intelligence enforcement to filter/block candidates
    // ============================================================================
    console.log(`🛡️ Stage 6: Applying enforcement rules to ${aiResponse.candidates.length} candidates...`);
    
    // Extract compressed calendar data from first participant (all should have same view of availability)
    const compressedCalendar = enrichedRequest.participants[0]?.calendar_summary?.busy_slots || [];
    
    // Apply enforcement to each candidate
    const enforcedCandidates = [];
    let blockedCount = 0;
    let warningCount = 0;
    
    for (const candidate of aiResponse.candidates) {
      const startTime = typeof candidate.slot.start === 'string' 
        ? candidate.slot.start 
        : new Date(candidate.slot.start).toISOString();
      const endTime = typeof candidate.slot.end === 'string' 
        ? candidate.slot.end 
        : new Date(candidate.slot.end).toISOString();
      
      const context: EnforcementContext = {
        meeting_id: enrichedRequest.meeting_id,
        candidate: {
          start_time: startTime,
          end_time: endTime,
          score: candidate.score,
          reasoning: candidate.reasoning,
        },
        compressed_calendar: compressedCalendar.map((slot: any) => ({
          start: typeof slot.start === 'string' ? slot.start : new Date(slot.start).toISOString(),
          end: typeof slot.end === 'string' ? slot.end : new Date(slot.end).toISOString(),
          summary: '',
          location: '',
        })),
        buffer_minutes: enrichedRequest.constraints.buffer_minutes || 15,
        timezone: enrichedRequest.constraints.timezone,
        duration_minutes: enrichedRequest.constraints.duration_minutes,
      };
      
      // Apply enforcement rules
      const enforcement = await applyEnforcementRules(context);
      
      if (enforcement.action === 'block') {
        blockedCount++;
        // Don't include blocked candidates in response
        console.log(`  ❌ BLOCKED: ${startTime} - ${enforcement.explanation}`);
      } else {
        // Include passed or warned candidates
        if (enforcement.action === 'warn') {
          warningCount++;
          console.log(`  ⚠️  WARNING: ${startTime} - ${enforcement.explanation}`);
        }
        
        // Enhance candidate with enforcement metadata
        enforcedCandidates.push({
          ...candidate,
          enforcement: {
            status: enforcement.action,
            cancellation_risk: enforcement.cancellation_risk.risk,
            cancellation_risk_score: enforcement.cancellation_risk.score,
            time_savings_minutes: enforcement.time_savings.minutes_saved,
            warnings: enforcement.warnings.map(w => w.reason),
          },
        });
      }
    }
    
    console.log(`✅ Enforcement complete:`);
    console.log(`   - ${enforcedCandidates.length} candidates passed`);
    console.log(`   - ${blockedCount} candidates blocked`);
    console.log(`   - ${warningCount} candidates with warnings`);
    
    // Return filtered response with enforcement metadata
    const enforcedResponse: ScheduleResponse = {
      ...aiResponse,
      candidates: enforcedCandidates,
      enforcement_summary: {
        total_candidates: aiResponse.candidates.length,
        passed: enforcedCandidates.length,
        blocked: blockedCount,
        warnings: warningCount,
      },
    };
    
    // Persist to database (non-blocking - don't fail request on DB errors)
    if (isDatabaseEnabled()) {
      persistSchedulingSession(enrichedRequest, enforcedResponse, body.userId)
        .then(() => {
          console.log(`✅ Successfully persisted scheduling session: ${enrichedRequest.meeting_id}`);
        })
        .catch((error) => {
          console.error(`⚠️ Failed to persist scheduling session ${enrichedRequest.meeting_id}:`, error);
          // Continue anyway - persistence failure shouldn't break the API response
        });
    } else {
      console.log('ℹ️ Database persistence is disabled (ENABLE_DATABASE_PERSISTENCE=false)');
    }
    
    return NextResponse.json<ScheduleResponse>(enforcedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Processing-Time': `${aiResponse.processing_time_ms}ms`,
        'X-Enforcement-Blocked': blockedCount.toString(),
        'X-Enforcement-Warned': warningCount.toString(),
      },
    });

  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Request timeout',
          message: `AI service did not respond within ${REQUEST_TIMEOUT_MS}ms`,
          status: 504,
        },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Service unavailable',
          message: 'Cannot connect to AI service. Please ensure Python service is running.',
          status: 503,
        },
        { status: 503 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          status: 400,
        },
        { status: 400 }
      );
    }

    // Handle unknown errors
    console.error('Unexpected error in /api/schedule:', error);
    
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        status: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/schedule
 * Health check endpoint.
 */
export async function GET() {
  try {
    // Check if Python service is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'AI service is not healthy',
          python_service: 'unhealthy',
        },
        { status: 503 }
      );
    }

    const healthData = await response.json();

    return NextResponse.json({
      status: 'healthy',
      message: 'Next.js orchestrator is running',
      python_service: 'healthy',
      python_service_url: PYTHON_SERVICE_URL,
      python_health: healthData,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Cannot connect to AI service',
        python_service: 'unreachable',
        python_service_url: PYTHON_SERVICE_URL,
        error: error.message,
      },
      { status: 503 }
    );
  }
}

/**
 * OPTIONS /api/schedule
 * Handle CORS preflight requests.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
