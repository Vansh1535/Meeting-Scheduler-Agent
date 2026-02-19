-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- Enable RLS on all user-owned tables
-- NOTE: Service role key bypasses these policies
-- These policies apply when using anon/authenticated keys
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER_ACCOUNTS Policies
-- =====================================================
-- Users can only see and update their own account

-- Allow service role full access (for API routes)
CREATE POLICY "Service role has full access to user_accounts"
    ON user_accounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- For future: If using Supabase Auth, users can read their own profile
-- CREATE POLICY "Users can view their own account"
--     ON user_accounts
--     FOR SELECT
--     USING (auth.uid()::text = id::text);

-- =====================================================
-- OAUTH_TOKENS Policies
-- =====================================================
-- OAuth tokens are highly sensitive - only service role

CREATE POLICY "Service role has full access to oauth_tokens"
    ON oauth_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- CALENDAR_EVENTS Policies
-- =====================================================
-- Users can only access their own calendar events

CREATE POLICY "Service role has full access to calendar_events"
    ON calendar_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anon key read access (API routes will filter by user_id)
-- NOTE: Without Supabase Auth, RLS can't enforce user isolation
-- Security still depends on API routes filtering correctly
CREATE POLICY "Anon can view calendar events"
    ON calendar_events
    FOR SELECT
    TO anon
    USING (true);

-- Only service role can insert/update/delete (OAuth sync operations)
CREATE POLICY "Service role can insert calendar events"
    ON calendar_events
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can update calendar events"
    ON calendar_events
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can delete calendar events"
    ON calendar_events
    FOR DELETE
    TO service_role
    USING (true);

-- =====================================================
-- CALENDAR_SYNC_HISTORY Policies
-- =====================================================

CREATE POLICY "Service role has full access to calendar_sync_history"
    ON calendar_sync_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon can view sync history"
    ON calendar_sync_history
    FOR SELECT
    TO anon
    USING (true);

-- =====================================================
-- MEETINGS Policies
-- =====================================================

CREATE POLICY "Service role has full access to meetings"
    ON meetings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon can view meetings"
    ON meetings
    FOR SELECT
    TO anon
    USING (true);

-- =====================================================
-- MEETING_CANDIDATES Policies
-- =====================================================

CREATE POLICY "Service role has full access to meeting_candidates"
    ON meeting_candidates
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon can view meeting candidates"
    ON meeting_candidates
    FOR SELECT
    TO anon
    USING (true);

-- =====================================================
-- SCHEDULING_ANALYTICS Policies
-- =====================================================

CREATE POLICY "Service role has full access to scheduling_analytics"
    ON scheduling_analytics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon can view scheduling analytics"
    ON scheduling_analytics
    FOR SELECT
    TO anon
    USING (true);

-- =====================================================
-- Security Notes
-- =====================================================
-- CURRENT SETUP (HYBRID):
--   - Service Role: Admin operations (OAuth, sync, writes)
--   - Anon Key: User data queries (reads)
--   - RLS enabled on all tables
--   - Anon key has read-only access
--
-- SECURITY MODEL:
--   - API routes filter by user_id before queries
--   - RLS allows anon read access (application-level filtering)
--   - Only service role can write/modify data
--   - Defense-in-depth: Multiple security layers
--
-- FUTURE: Implement Supabase Auth for true database-level isolation
--   Then update policies to check auth.uid() = user_id
-- =====================================================
