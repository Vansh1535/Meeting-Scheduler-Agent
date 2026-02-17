/**
 * Supabase Client Configuration
 * 
 * Server-side Supabase client with service role key.
 * IMPORTANT: Only use in API routes (server-side), never expose to client.
 */

import { createClient } from '@supabase/supabase-js';
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
      persistSession: false, // Server-side, no session persistence
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
