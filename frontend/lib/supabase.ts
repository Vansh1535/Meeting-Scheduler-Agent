/**
 * Supabase Client Configuration - Hybrid Model
 * 
 * Uses two different clients:
 * - Anon Key: For user data queries (respects RLS)
 * - Service Role: For admin operations (OAuth tokens, sync)
 * 
 * This provides defense-in-depth security.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * DEFAULT CLIENT - Anon Key (RLS-protected)
 * Use for: User data queries (calendar events, meetings, analytics)
 * ✅ Respects Row Level Security policies
 * ✅ Safe to use - RLS prevents unauthorized access
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
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
 * ADMIN CLIENT - Service Role Key
 * Use for: OAuth tokens, calendar sync, admin operations
 * ⚠️ Bypasses RLS - use only when necessary
 * ⚠️ Never expose to frontend
 */
export const supabaseAdmin = createClient<Database>(
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
 * Check if database persistence is enabled via environment config.
 * Allows disabling DB writes for testing/development.
 */
export const isDatabaseEnabled = (): boolean => {
  const enabled = process.env.ENABLE_DATABASE_PERSISTENCE;
  return enabled === undefined || enabled === 'true';
};

/**
 * Test database connection.
 * Useful for health checks and debugging.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}
