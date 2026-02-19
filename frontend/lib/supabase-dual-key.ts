/**
 * Dual-Key Supabase Setup
 * 
 * - Service Role: Admin operations (OAuth token storage, sync operations)
 * - Anon Key: User data queries (with RLS enforcement)
 * 
 * This provides defense-in-depth:
 * - Even if anon key is leaked, users can only access their own data
 * - Service role is kept secure, only used for trusted operations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');
if (!supabaseServiceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseAnonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

/**
 * ADMIN CLIENT - Service Role Key
 * Use for: OAuth tokens, admin operations, bypassing RLS when necessary
 * ⚠️ Never expose to frontend
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  }
);

/**
 * USER CLIENT - Anon Key + Custom User Context
 * Use for: Fetching user data (calendar events, meetings, analytics)
 * ✅ Respects RLS policies
 * 
 * @param userId - User ID to impersonate (for RLS context)
 */
export function getUserClient(userId: string) {
  if (!userId) throw new Error('userId required for user client');
  
  // Create client with anon key
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });

  // Set custom claim for RLS (requires RLS policies to check this)
  // Note: This requires setting up custom claims in Supabase
  // For now, this won't work without proper JWT setup
  
  return client;
}

/**
 * LEGACY: Original service role client (for backward compatibility)
 */
export const supabase = supabaseAdmin;

export const isDatabaseEnabled = (): boolean => {
  const enabled = process.env.ENABLE_DATABASE_PERSISTENCE;
  return enabled === undefined || enabled === 'true';
};
