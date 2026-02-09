-- =====================================================
-- Stage 4: Google Calendar + ScaleDown Integration
-- =====================================================
-- Migration: Add tables for OAuth, calendar data, and ScaleDown compressed patterns
-- 
-- Design Principles:
-- - Secure storage of OAuth tokens (encrypted at rest)
-- - Cache raw calendar events to minimize Google API calls
-- - Store ScaleDown compressed patterns for fast AI scheduling
-- - Track sync operations for debugging and rate limiting
-- =====================================================

-- =====================================================
-- TABLE: user_accounts
-- =====================================================
-- Stores user information for calendar integration
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    email TEXT NOT NULL UNIQUE,
    google_user_id TEXT UNIQUE, -- Google's sub claim from ID token
    display_name TEXT,
    profile_picture_url TEXT,
    
    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT true,
    calendar_sync_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_user_accounts_email ON user_accounts(email);
CREATE INDEX idx_user_accounts_google_id ON user_accounts(google_user_id);

-- =====================================================
-- TABLE: oauth_tokens
-- =====================================================
-- Stores encrypted OAuth tokens for Google Calendar API access
-- Security: Tokens encrypted at rest using Supabase Vault (or application-level encryption)
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    
    -- OAuth credentials (store encrypted in production)
    provider TEXT NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL, -- ⚠️ Encrypt in production
    refresh_token TEXT, -- ⚠️ Encrypt in production
    token_type TEXT NOT NULL DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Scope granted
    scopes TEXT[] NOT NULL, -- e.g., ['https://www.googleapis.com/auth/calendar.readonly']
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_refreshed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT oauth_tokens_unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- =====================================================
-- TABLE: calendar_events
-- =====================================================
-- Caches raw calendar events from Google Calendar
-- Purpose: Minimize API calls, enable offline analysis, audit trail
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    
    -- Google Calendar event details
    google_event_id TEXT NOT NULL,
    google_calendar_id TEXT NOT NULL, -- Which calendar this event belongs to
    
    -- Event details
    title TEXT,
    description TEXT,
    location TEXT,
    
    -- Time details
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    is_all_day BOOLEAN NOT NULL DEFAULT false,
    
    -- Event metadata
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, tentative, cancelled
    visibility TEXT NOT NULL DEFAULT 'default', -- public, private, default
    attendee_count INTEGER NOT NULL DEFAULT 0,
    is_organizer BOOLEAN NOT NULL DEFAULT false,
    response_status TEXT, -- accepted, declined, tentative, needsAction
    
    -- Recurrence
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_event_id TEXT, -- ID of recurring event instance
    
    -- Raw data for debugging
    raw_event JSONB, -- Full Google Calendar event JSON
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT calendar_events_unique_google_event UNIQUE (user_id, google_event_id)
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_time_range ON calendar_events(user_id, start_time, end_time);
CREATE INDEX idx_calendar_events_google_event_id ON calendar_events(google_event_id);

-- =====================================================
-- TABLE: compressed_calendars
-- =====================================================
-- Stores ScaleDown AI compressed calendar patterns
-- Purpose: Fast availability lookup for scheduling without querying full event history
CREATE TABLE IF NOT EXISTS compressed_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    
    -- Compression metadata
    source_event_count INTEGER NOT NULL, -- Original events before compression
    compressed_size_bytes INTEGER, -- Size of compressed output
    compression_ratio NUMERIC(5, 2), -- e.g., 0.80 for 80% compression
    
    -- Time range covered
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- ScaleDown compressed output
    availability_patterns JSONB NOT NULL, -- Weekly recurring patterns
    busy_probability_map JSONB NOT NULL, -- Probability of being busy per time slot
    meeting_density_scores JSONB NOT NULL, -- Meeting frequency by day/time
    preferred_meeting_times JSONB, -- Learned preferences from history
    
    -- Pattern insights (from ScaleDown)
    typical_work_hours JSONB, -- Start/end times by day of week
    average_meeting_duration_minutes INTEGER,
    most_common_meeting_types JSONB, -- Categories inferred by ScaleDown
    
    -- ScaleDown metadata
    scaledown_model_version TEXT,
    scaledown_request_id TEXT, -- For debugging/support
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true, -- Most recent compression for user
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional: compressed data validity period
    
    -- Constraints
    CONSTRAINT compressed_calendars_valid_period CHECK (period_end > period_start)
);

CREATE INDEX idx_compressed_calendars_user_id ON compressed_calendars(user_id);
CREATE INDEX idx_compressed_calendars_active ON compressed_calendars(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_compressed_calendars_period ON compressed_calendars(period_start, period_end);

-- =====================================================
-- TABLE: calendar_sync_history
-- =====================================================
-- Tracks calendar synchronization operations
-- Purpose: Debugging, rate limiting, audit trail, error tracking
CREATE TABLE IF NOT EXISTS calendar_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual', 'scheduled'
    status TEXT NOT NULL, -- 'initiated', 'fetching', 'compressing', 'completed', 'failed'
    
    -- Google Calendar sync
    events_fetched INTEGER NOT NULL DEFAULT 0,
    events_added INTEGER NOT NULL DEFAULT 0,
    events_updated INTEGER NOT NULL DEFAULT 0,
    events_deleted INTEGER NOT NULL DEFAULT 0,
    google_api_calls INTEGER NOT NULL DEFAULT 0,
    
    -- ScaleDown compression
    scaledown_called BOOLEAN NOT NULL DEFAULT false,
    scaledown_duration_ms INTEGER,
    scaledown_error TEXT,
    
    -- Performance metrics
    total_duration_ms INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Error tracking
    error_message TEXT,
    error_stack TEXT,
    
    -- Metadata
    sync_triggered_by TEXT, -- 'user', 'cron', 'webhook', 'manual'
    
    CONSTRAINT calendar_sync_history_valid_status CHECK (
        status IN ('initiated', 'fetching', 'compressing', 'completed', 'failed')
    )
);

CREATE INDEX idx_calendar_sync_history_user_id ON calendar_sync_history(user_id);
CREATE INDEX idx_calendar_sync_history_status ON calendar_sync_history(status);
CREATE INDEX idx_calendar_sync_history_started_at ON calendar_sync_history(started_at DESC);

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active user calendar status
CREATE OR REPLACE VIEW v_user_calendar_status AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    u.calendar_sync_enabled,
    
    -- OAuth status
    CASE 
        WHEN ot.expires_at > NOW() THEN 'valid'
        WHEN ot.expires_at IS NOT NULL THEN 'expired'
        ELSE 'not_connected'
    END as oauth_status,
    ot.expires_at as token_expires_at,
    
    -- Calendar data status
    COUNT(DISTINCT ce.id) as cached_events_count,
    MAX(ce.synced_at) as last_event_sync,
    
    -- Compression status
    cc.id as active_compression_id,
    cc.compression_ratio,
    cc.period_start as compressed_period_start,
    cc.period_end as compressed_period_end,
    cc.created_at as compression_created_at,
    
    -- Last sync
    ls.started_at as last_sync_started,
    ls.status as last_sync_status
    
FROM user_accounts u
LEFT JOIN oauth_tokens ot ON u.id = ot.user_id AND ot.provider = 'google'
LEFT JOIN calendar_events ce ON u.id = ce.user_id
LEFT JOIN compressed_calendars cc ON u.id = cc.user_id AND cc.is_active = true
LEFT JOIN LATERAL (
    SELECT started_at, status 
    FROM calendar_sync_history 
    WHERE user_id = u.id 
    ORDER BY started_at DESC 
    LIMIT 1
) ls ON true
GROUP BY u.id, u.email, u.display_name, u.calendar_sync_enabled, 
         ot.expires_at, cc.id, cc.compression_ratio, cc.period_start, 
         cc.period_end, cc.created_at, ls.started_at, ls.status;

-- View: Sync operation metrics
CREATE OR REPLACE VIEW v_sync_metrics AS
SELECT 
    DATE_TRUNC('day', started_at) as sync_date,
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
    AVG(total_duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms,
    SUM(events_fetched) as total_events_fetched,
    SUM(google_api_calls) as total_api_calls,
    COUNT(DISTINCT user_id) as unique_users_synced
FROM calendar_sync_history
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY sync_date DESC;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at
    BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Deactivate old compressions when new one is created
CREATE OR REPLACE FUNCTION deactivate_old_compressions()
RETURNS TRIGGER AS $$
BEGIN
    -- Deactivate all other compressions for this user
    UPDATE compressed_calendars
    SET is_active = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deactivate_old_compressions_trigger
    AFTER INSERT ON compressed_calendars
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION deactivate_old_compressions();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Check if user has valid OAuth token
CREATE OR REPLACE FUNCTION has_valid_oauth_token(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM oauth_tokens 
        WHERE user_id = p_user_id 
          AND provider = 'google'
          AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Get active compressed calendar for user
CREATE OR REPLACE FUNCTION get_active_compressed_calendar(p_user_id UUID)
RETURNS TABLE (
    availability_patterns JSONB,
    busy_probability_map JSONB,
    meeting_density_scores JSONB,
    preferred_meeting_times JSONB,
    typical_work_hours JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.availability_patterns,
        cc.busy_probability_map,
        cc.meeting_density_scores,
        cc.preferred_meeting_times,
        cc.typical_work_hours
    FROM compressed_calendars cc
    WHERE cc.user_id = p_user_id
      AND cc.is_active = true
    ORDER BY cc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_accounts IS 'Stores user information for calendar integration';
COMMENT ON TABLE oauth_tokens IS 'Stores encrypted OAuth tokens for Google Calendar API access';
COMMENT ON TABLE calendar_events IS 'Caches raw calendar events from Google Calendar';
COMMENT ON TABLE compressed_calendars IS 'Stores ScaleDown AI compressed calendar patterns for fast scheduling';
COMMENT ON TABLE calendar_sync_history IS 'Tracks calendar synchronization operations for debugging and audit';

COMMENT ON COLUMN oauth_tokens.access_token IS '⚠️ SECURITY: Encrypt at rest in production using application-level encryption';
COMMENT ON COLUMN oauth_tokens.refresh_token IS '⚠️ SECURITY: Encrypt at rest in production using application-level encryption';
COMMENT ON COLUMN compressed_calendars.availability_patterns IS 'Weekly recurring free/busy patterns from ScaleDown';
COMMENT ON COLUMN compressed_calendars.busy_probability_map IS 'Probability distribution of being busy per time slot';
COMMENT ON COLUMN compressed_calendars.meeting_density_scores IS 'Meeting frequency and density by day/time from ScaleDown';
