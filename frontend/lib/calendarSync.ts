/**
 * Calendar Synchronization Service
 * 
 * Orchestrates the complete calendar sync flow:
 * 1. Fetch 12 months of events from Google Calendar
 * 2. Store events in Supabase (caching)
 * 3. Send events to ScaleDown for compression
 * 4. Store compressed patterns in Supabase
 * 5. Track sync operation metrics
 */

import { supabaseAdmin as supabase } from './supabase'; // Use admin for sync operations (writes)
import { fetchCalendarEvents, storeCalendarEvents, CalendarEvent } from './googleCalendar';
import { compressCalendarHistory, CalendarCompressionResponse } from './scaledown';

export interface SyncOptions {
  timeRangeMonths?: number; // Default: 12 months
  forceRefresh?: boolean; // Ignore cached data, fetch from Google
  skipCompression?: boolean; // Skip ScaleDown compression (testing only)
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  eventsFetched: number;
  eventsAdded: number;
  eventsUpdated: number;
  eventsDeleted: number;
  compressionCompleted: boolean;
  compressionRatio?: number;
  totalDurationMs: number;
  error?: string;
}

/**
 * Perform complete calendar synchronization for user
 */
export async function syncUserCalendar(
  userId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const {
    timeRangeMonths = 12,
    forceRefresh = false,
    skipCompression = false,
  } = options;

  const startTime = Date.now();
  let syncId: string = '';

  try {
    // Create sync history record
    const { data: syncRecord, error: syncError } = await supabase
      .from('calendar_sync_history')
      .insert({
        user_id: userId,
        sync_type: forceRefresh ? 'full' : 'incremental',
        status: 'initiated',
        sync_triggered_by: 'api',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (syncError || !syncRecord) {
      throw new Error('Failed to create sync history record');
    }

    syncId = syncRecord.id;

    // Step 1: Fetch events from Google Calendar (Past + Future)
    console.log(`📅 Step 1/4: Fetching calendar events from Google (±${timeRangeMonths} months)...`);
    
    await updateSyncStatus(syncId, 'fetching');

    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - timeRangeMonths);
    
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + timeRangeMonths);

    const events = await fetchCalendarEvents(userId, {
      timeMin,
      timeMax,
    });

    // Update sync record with fetch stats
    await supabase
      .from('calendar_sync_history')
      .update({
        events_fetched: events.length,
        google_api_calls: Math.ceil(events.length / 250), // Estimate
      })
      .eq('id', syncId);

    // Step 2: Store events in database
    console.log(`💾 Step 2/4: Storing ${events.length} events in database...`);

    const { added, updated, deleted } = await storeCalendarEvents(userId, events);

    await supabase
      .from('calendar_sync_history')
      .update({
        events_added: added,
        events_updated: updated,
        events_deleted: deleted,
      })
      .eq('id', syncId);

    console.log(`📊 Sync stats: ${added} added, ${updated} updated, ${deleted} deleted`);

    // Step 3: Compress with ScaleDown (if enabled)
    let compressionCompleted = false;
    let compressionRatio: number | undefined;

    if (!skipCompression && events.length > 0) {
      console.log(`🤖 Step 3/4: Compressing calendar with ScaleDown AI...`);
      
      await updateSyncStatus(syncId, 'compressing');

      try {
        const compressionStart = Date.now();
        const compressed = await compressCalendarHistory(userId, events);
        const compressionDuration = Date.now() - compressionStart;

        // Step 4: Store compressed patterns
        console.log(`💾 Step 4/4: Storing compressed patterns in database...`);
        
        await storeCompressedCalendar(userId, events, compressed);

        compressionCompleted = true;
        compressionRatio = compressed.compression_ratio;

        await supabase
          .from('calendar_sync_history')
          .update({
            scaledown_called: true,
            scaledown_duration_ms: compressionDuration,
          })
          .eq('id', syncId);

        console.log(`✅ Compression completed: ${(compressionRatio * 100).toFixed(1)}% reduction`);
      } catch (compressionError: any) {
        console.error('❌ Compression failed:', compressionError.message);
        
        await supabase
          .from('calendar_sync_history')
          .update({
            scaledown_called: true,
            scaledown_error: compressionError.message,
          })
          .eq('id', syncId);

        // Continue without compression - sync is still successful
      }
    } else {
      console.log(`⏭️  Step 3/4: Skipping compression (${events.length} events)`);
    }

    // Mark sync as completed
    const totalDuration = Date.now() - startTime;
    
    await supabase
      .from('calendar_sync_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_duration_ms: totalDuration,
      })
      .eq('id', syncId);

    console.log(`✅ Calendar sync completed in ${totalDuration}ms`);

    return {
      success: true,
      syncId,
      eventsFetched: events.length,
      eventsAdded: added,
      eventsUpdated: updated,
      eventsDeleted: deleted,
      compressionCompleted,
      compressionRatio,
      totalDurationMs: totalDuration,
    };

  } catch (error: any) {
    console.error('❌ Calendar sync failed:', error);

    // Mark sync as failed
    if (syncId) {
      const totalDuration = Date.now() - startTime;
      
      await supabase
        .from('calendar_sync_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          total_duration_ms: totalDuration,
          error_message: error.message,
          error_stack: error.stack,
        })
        .eq('id', syncId);
    }

    return {
      success: false,
      syncId,
      eventsFetched: 0,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      compressionCompleted: false,
      totalDurationMs: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Store compressed calendar patterns in database
 */
async function storeCompressedCalendar(
  userId: string,
  events: CalendarEvent[],
  compressed: CalendarCompressionResponse
): Promise<void> {
  const periodStart = events.length > 0
    ? new Date(Math.min(...events.map(e => new Date(e.start_time).getTime())))
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  
  const periodEnd = events.length > 0
    ? new Date(Math.max(...events.map(e => new Date(e.end_time).getTime())))
    : new Date();

  const { error } = await supabase
    .from('compressed_calendars')
    .insert({
      user_id: userId,
      source_event_count: events.length,
      compression_ratio: compressed.compression_ratio,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      availability_patterns: compressed.availability_patterns,
      busy_probability_map: compressed.busy_probability_map,
      meeting_density_scores: compressed.meeting_density_scores,
      preferred_meeting_times: compressed.preferred_meeting_times,
      typical_work_hours: compressed.typical_work_hours,
      average_meeting_duration_minutes: compressed.insights.average_meeting_duration_minutes,
      scaledown_model_version: compressed.model_version,
      scaledown_request_id: compressed.request_id,
      is_active: true,
    });

  if (error) throw error;
}

/**
 * Update sync status
 */
async function updateSyncStatus(
  syncId: string,
  status: 'initiated' | 'fetching' | 'compressing' | 'completed' | 'failed'
): Promise<void> {
  await supabase
    .from('calendar_sync_history')
    .update({ status })
    .eq('id', syncId);
}

/**
 * Get user's active compressed calendar
 */
export async function getActiveCompressedCalendar(userId: string) {
  const { data, error } = await supabase
    .from('compressed_calendars')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return data;
}

/**
 * Check if user needs calendar sync
 */
export async function needsCalendarSync(userId: string): Promise<boolean> {
  // Check if compressed calendar exists and is recent
  const compressed = await getActiveCompressedCalendar(userId);
  
  if (!compressed) return true;

  // Check if compression is older than 7 days
  const createdAt = new Date(compressed.created_at);
  const daysSinceCompression = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceCompression > 7;
}

/**
 * Get last sync status for user
 */
export async function getLastSyncStatus(userId: string) {
  const { data, error } = await supabase
    .from('calendar_sync_history')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    status: data.status,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    eventsFetched: data.events_fetched,
    eventsAdded: data.events_added,
    eventsUpdated: data.events_updated,
    compressionCompleted: data.scaledown_called,
    totalDurationMs: data.total_duration_ms,
    error: data.error_message,
  };
}
