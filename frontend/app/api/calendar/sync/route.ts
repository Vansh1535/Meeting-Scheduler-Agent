/**
 * API Route: /api/calendar/sync
 * 
 * Triggers calendar synchronization for a user:
 * 1. Fetch 12 months of events from Google Calendar
 * 2. Store in Supabase
 * 3. Compress with ScaleDown AI
 * 4. Store compressed patterns
 * 
 * POST /api/calendar/sync
 * Body: { user_id: string, force_refresh?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncUserCalendar, getLastSyncStatus } from '@/lib/calendarSync';
import { hasValidOAuthConnection } from '@/lib/googleAuth';

interface SyncRequest {
  user_id: string;
  force_refresh?: boolean;
  skip_compression?: boolean; // For testing
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();

    // Validate request
    if (!body.user_id) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'user_id is required',
        },
        { status: 400 }
      );
    }

    // Check if user has valid OAuth connection
    const hasValidAuth = await hasValidOAuthConnection(body.user_id);
    
    if (!hasValidAuth) {
      return NextResponse.json(
        {
          error: 'Not authorized',
          message: 'User has not connected Google Calendar. Please complete OAuth flow first.',
          auth_url: '/api/auth/google/initiate',
        },
        { status: 401 }
      );
    }

    console.log(`🔄 Starting calendar sync for user: ${body.user_id}`);

    // Perform sync
    const result = await syncUserCalendar(body.user_id, {
      forceRefresh: body.force_refresh || false,
      skipCompression: body.skip_compression || false,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Sync failed',
          message: result.error || 'Calendar synchronization failed',
          sync_id: result.syncId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar synchronized successfully',
      sync_id: result.syncId,
      events_fetched: result.eventsFetched,
      events_added: result.eventsAdded,
      events_updated: result.eventsUpdated,
      compression_completed: result.compressionCompleted,
      compression_ratio: result.compressionRatio,
      duration_ms: result.totalDurationMs,
    });

  } catch (error: any) {
    console.error('❌ Calendar sync request failed:', error);

    return NextResponse.json(
      {
        error: 'Sync request failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync?user_id=xxx
 * Get last sync status for user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'user_id query parameter is required',
        },
        { status: 400 }
      );
    }

    const lastSync = await getLastSyncStatus(userId);

    if (!lastSync) {
      return NextResponse.json(
        {
          message: 'No sync history found for user',
          user_id: userId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user_id: userId,
      last_sync: lastSync,
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch sync status:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch sync status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
