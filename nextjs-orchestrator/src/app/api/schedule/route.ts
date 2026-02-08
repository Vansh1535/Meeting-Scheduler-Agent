/**
 * Next.js API Route: /api/schedule
 * 
 * Thin orchestration layer that forwards scheduling requests to the Python AI Brain.
 * 
 * Responsibilities:
 * - Accept POST requests with scheduling data
 * - Validate basic request structure
 * - Forward to Python FastAPI service
 * - Persist AI outputs to Supabase (if enabled)
 * - Handle errors and timeouts
 * - Return AI response unchanged
 * 
 * Does NOT:
 * - Implement AI logic (Python handles this)
 * - Call ScaleDown
 * - Modify responses (persistence is transparent)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ScheduleRequest, ScheduleResponse, ErrorResponse } from '@/types/scheduling';
import { persistSchedulingSession } from '@/lib/schedulingPersistence';
import { isDatabaseEnabled } from '@/lib/supabase';

// Configuration
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);

/**
 * POST /api/schedule
 * Forward scheduling request to Python AI Brain service.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ScheduleRequest = await request.json();

    // Basic validation
    if (!body.meeting_id || !body.participants || !body.constraints) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'Missing required fields: meeting_id, participants, or constraints',
          status: 400,
        },
        { status: 400 }
      );
    }

    if (body.participants.length < 2) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request',
          message: 'At least 2 participants are required',
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
      body: JSON.stringify(body),
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

    // Return AI response unchanged
    const aiResponse: ScheduleResponse = await pythonResponse.json();
    
    // Persist to database (non-blocking - don't fail request on DB errors)
    if (isDatabaseEnabled()) {
      persistSchedulingSession(body, aiResponse)
        .then(() => {
          console.log(`✅ Successfully persisted scheduling session: ${body.meeting_id}`);
        })
        .catch((error) => {
          console.error(`⚠️ Failed to persist scheduling session ${body.meeting_id}:`, error);
          // Continue anyway - persistence failure shouldn't break the API response
        });
    } else {
      console.log('ℹ️ Database persistence is disabled (ENABLE_DATABASE_PERSISTENCE=false)');
    }
    
    return NextResponse.json<ScheduleResponse>(aiResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Processing-Time': `${aiResponse.processing_time_ms}ms`,
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
