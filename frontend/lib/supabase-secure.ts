/**
 * Security-Enhanced Supabase Client
 * 
 * Provides helper functions that automatically enforce user isolation
 * even when using service_role_key.
 * 
 * This is a defense-in-depth measure to prevent accidental data leaks
 * caused by forgetting to add .eq('user_id', userId) filters.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Server-side Supabase client with service role privileges.
 * Bypasses Row Level Security - use with caution.
 * 
 * @returns Authenticated Supabase client
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  }
);

/**
 * Security-enhanced query builders that automatically filter by user_id
 * 
 * Usage:
 *   const { calendar, meetings } = getUserQueries(userId);
 *   const events = await calendar.select('*');  // Auto-filtered by user_id
 */
export function getUserQueries(userId: string) {
  if (!userId) {
    throw new Error('userId is required for user-scoped queries');
  }

  return {
    // Calendar events - auto-filtered by user_id
    calendar: supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId),

    // Meetings - auto-filtered by user_id
    meetings: supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId),

    // OAuth tokens - auto-filtered by user_id
    tokens: supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId),

    // Sync history - auto-filtered by user_id
    syncHistory: supabase
      .from('calendar_sync_history')
      .select('*')
      .eq('user_id', userId),

    // User account
    account: supabase
      .from('user_accounts')
      .select('*')
      .eq('id', userId),
  };
}

/**
 * Validate that a user ID is a valid UUID
 * Prevents SQL injection through user_id parameter
 */
export function validateUserId(userId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * Check if database persistence is enabled via environment config.
 * Allows disabling DB writes for testing/development.
 */
export const isDatabaseEnabled = (): boolean => {
  const enabled = process.env.ENABLE_DATABASE_PERSISTENCE;
  return enabled === undefined || enabled === 'true';
};
