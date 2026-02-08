-- =====================================================
-- AI Meeting Scheduler - Supabase Database Schema
-- =====================================================
-- Purpose: Persist AI scheduling outputs for analytics and explainability
-- Design: Normalized schema with proper relationships and indexes
-- Note: AI logic remains in Python service (database-agnostic)

-- =====================================================
-- TABLE: meetings
-- =====================================================
-- Stores high-level meeting scheduling requests and results
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id TEXT NOT NULL UNIQUE, -- External meeting identifier from client
    
    -- Request metadata
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    participant_count INTEGER NOT NULL,
    required_participant_count INTEGER NOT NULL,
    optional_participant_count INTEGER NOT NULL,
    
    -- Scheduling constraints
    duration_minutes INTEGER NOT NULL,
    earliest_date TIMESTAMPTZ NOT NULL,
    latest_date TIMESTAMPTZ NOT NULL,
    buffer_minutes INTEGER NOT NULL DEFAULT 15,
    
    -- Processing results
    success BOOLEAN NOT NULL,
    total_candidates_evaluated INTEGER NOT NULL,
    candidates_returned INTEGER NOT NULL,
    processing_time_ms NUMERIC(10, 2) NOT NULL,
    negotiation_rounds INTEGER NOT NULL DEFAULT 0,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending', -- pending, scheduled, cancelled
    selected_candidate_id UUID NULL, -- FK to meeting_candidates when user selects
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT meetings_status_check CHECK (status IN ('pending', 'scheduled', 'cancelled'))
);

CREATE INDEX idx_meetings_meeting_id ON meetings(meeting_id);
CREATE INDEX idx_meetings_requested_at ON meetings(requested_at DESC);
CREATE INDEX idx_meetings_status ON meetings(status);

-- =====================================================
-- TABLE: meeting_candidates
-- =====================================================
-- Stores each ranked candidate time slot from AI Brain
CREATE TABLE IF NOT EXISTS meeting_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    
    -- Slot details
    slot_start TIMESTAMPTZ NOT NULL,
    slot_end TIMESTAMPTZ NOT NULL,
    slot_timezone TEXT NOT NULL DEFAULT 'UTC',
    
    -- AI scoring
    final_score NUMERIC(5, 2) NOT NULL, -- 0.00 - 100.00
    rank INTEGER NOT NULL, -- 1 = best candidate
    
    -- Score components
    availability_score NUMERIC(5, 2) NOT NULL,
    preference_score NUMERIC(5, 2) NOT NULL,
    optimization_score NUMERIC(5, 2) NOT NULL,
    conflict_proximity_score NUMERIC(5, 2) NOT NULL,
    fragmentation_score NUMERIC(5, 2) NOT NULL,
    
    -- Metadata
    all_participants_available BOOLEAN NOT NULL,
    conflict_participant_ids JSONB NOT NULL DEFAULT '[]', -- Array of user IDs with conflicts
    reasoning TEXT NOT NULL, -- Human-readable explanation
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT meeting_candidates_score_range CHECK (
        final_score >= 0 AND final_score <= 100 AND
        availability_score >= 0 AND availability_score <= 100 AND
        preference_score >= 0 AND preference_score <= 100 AND
        optimization_score >= 0 AND optimization_score <= 100 AND
        conflict_proximity_score >= 0 AND conflict_proximity_score <= 100 AND
        fragmentation_score >= 0 AND fragmentation_score <= 100
    ),
    CONSTRAINT meeting_candidates_rank_positive CHECK (rank > 0)
);

CREATE INDEX idx_meeting_candidates_meeting_id ON meeting_candidates(meeting_id);
CREATE INDEX idx_meeting_candidates_rank ON meeting_candidates(meeting_id, rank);
CREATE INDEX idx_meeting_candidates_score ON meeting_candidates(final_score DESC);
CREATE INDEX idx_meeting_candidates_slot_start ON meeting_candidates(slot_start);

-- =====================================================
-- TABLE: score_breakdowns
-- =====================================================
-- Stores detailed factor-level score breakdown for explainability
CREATE TABLE IF NOT EXISTS score_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES meeting_candidates(id) ON DELETE CASCADE,
    
    -- Raw factor scores (0-100)
    availability_factor NUMERIC(5, 2) NOT NULL,
    preference_factor NUMERIC(5, 2) NOT NULL,
    conflict_proximity_factor NUMERIC(5, 2) NOT NULL,
    fragmentation_factor NUMERIC(5, 2) NOT NULL,
    optimization_factor NUMERIC(5, 2) NOT NULL,
    
    -- Weights used (percentages, should sum to 100)
    availability_weight INTEGER NOT NULL DEFAULT 35,
    preference_weight INTEGER NOT NULL DEFAULT 25,
    conflict_proximity_weight INTEGER NOT NULL DEFAULT 20,
    fragmentation_weight INTEGER NOT NULL DEFAULT 15,
    optimization_weight INTEGER NOT NULL DEFAULT 5,
    
    -- Detailed breakdown (JSON for flexibility)
    availability_details JSONB NULL,
    conflict_proximity_details JSONB NULL,
    fragmentation_details JSONB NULL,
    optimization_details JSONB NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT score_breakdowns_factor_range CHECK (
        availability_factor >= 0 AND availability_factor <= 100 AND
        preference_factor >= 0 AND preference_factor <= 100 AND
        conflict_proximity_factor >= 0 AND conflict_proximity_factor <= 100 AND
        fragmentation_factor >= 0 AND fragmentation_factor <= 100 AND
        optimization_factor >= 0 AND optimization_factor <= 100
    ),
    CONSTRAINT score_breakdowns_weights_sum CHECK (
        availability_weight + preference_weight + conflict_proximity_weight + 
        fragmentation_weight + optimization_weight = 100
    )
);

CREATE INDEX idx_score_breakdowns_candidate_id ON score_breakdowns(candidate_id);

-- =====================================================
-- TABLE: scheduling_analytics
-- =====================================================
-- Stores per-request analytics and metrics
CREATE TABLE IF NOT EXISTS scheduling_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    
    -- Time savings
    estimated_time_saved_minutes NUMERIC(10, 2) NOT NULL,
    coordination_overhead_reduction_pct NUMERIC(5, 2) NOT NULL,
    
    -- Candidate quality
    top_candidate_confidence NUMERIC(5, 2) NOT NULL,
    avg_candidate_score NUMERIC(5, 2) NOT NULL,
    candidates_evaluated INTEGER NOT NULL,
    
    -- Conflict analysis
    total_conflicts INTEGER NOT NULL DEFAULT 0,
    conflict_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- Percentage
    most_constrained_participant_ids JSONB NOT NULL DEFAULT '[]',
    candidates_without_conflicts INTEGER NOT NULL DEFAULT 0,
    
    -- Group preferences (aggregated)
    total_participants INTEGER NOT NULL,
    morning_people_ratio NUMERIC(5, 4) NULL,
    avg_preferred_start_hour NUMERIC(5, 2) NULL,
    avg_preferred_end_hour NUMERIC(5, 2) NULL,
    buffer_sensitive_ratio NUMERIC(5, 4) NULL,
    
    -- Metadata
    total_slots_evaluated INTEGER NOT NULL,
    required_participants INTEGER NOT NULL,
    optional_participants INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(meeting_id) -- One analytics record per meeting
);

CREATE INDEX idx_scheduling_analytics_meeting_id ON scheduling_analytics(meeting_id);
CREATE INDEX idx_scheduling_analytics_confidence ON scheduling_analytics(top_candidate_confidence DESC);

-- =====================================================
-- TABLE: participant_availability (Optional - for future)
-- =====================================================
-- Stores participant-level availability summary
-- Useful for debugging and per-user analytics
CREATE TABLE IF NOT EXISTS participant_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    
    -- Participant info
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    is_required BOOLEAN NOT NULL,
    
    -- Availability summary
    total_busy_slots INTEGER NOT NULL DEFAULT 0,
    weekly_meeting_count INTEGER NOT NULL DEFAULT 0,
    peak_meeting_hours JSONB NOT NULL DEFAULT '[]', -- Array of hours
    
    -- Preferences
    preferred_days JSONB NOT NULL DEFAULT '[]',
    preferred_hours_start INTEGER NULL,
    preferred_hours_end INTEGER NULL,
    morning_person_score NUMERIC(3, 2) NULL,
    avoids_back_to_back BOOLEAN NULL,
    buffer_minutes INTEGER NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT participant_availability_unique UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_participant_availability_meeting_id ON participant_availability(meeting_id);
CREATE INDEX idx_participant_availability_user_id ON participant_availability(user_id);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS: Useful analytics queries
-- =====================================================

-- Top performing candidates across all meetings
CREATE OR REPLACE VIEW v_top_candidates AS
SELECT 
    m.meeting_id,
    m.requested_at,
    mc.slot_start,
    mc.slot_end,
    mc.final_score,
    mc.rank,
    mc.reasoning,
    m.participant_count,
    m.processing_time_ms
FROM meeting_candidates mc
JOIN meetings m ON mc.meeting_id = m.id
WHERE mc.rank <= 3
ORDER BY m.requested_at DESC, mc.rank ASC;

-- Meeting success metrics
CREATE OR REPLACE VIEW v_meeting_metrics AS
SELECT 
    DATE_TRUNC('day', requested_at) as date,
    COUNT(*) as total_meetings,
    COUNT(*) FILTER (WHERE success = true) as successful_meetings,
    AVG(processing_time_ms) as avg_processing_time_ms,
    AVG(candidates_returned) as avg_candidates_returned,
    AVG(participant_count) as avg_participant_count
FROM meetings
GROUP BY DATE_TRUNC('day', requested_at)
ORDER BY date DESC;

-- Score distribution analysis
CREATE OR REPLACE VIEW v_score_distribution AS
SELECT 
    FLOOR(final_score / 10) * 10 as score_bucket,
    COUNT(*) as candidate_count,
    AVG(availability_score) as avg_availability,
    AVG(preference_score) as avg_preference,
    AVG(conflict_proximity_score) as avg_proximity,
    AVG(fragmentation_score) as avg_fragmentation
FROM meeting_candidates
GROUP BY FLOOR(final_score / 10)
ORDER BY score_bucket DESC;

-- =====================================================
-- ROW LEVEL SECURITY (Optional - for multi-tenant)
-- =====================================================
-- Uncomment if implementing multi-tenant architecture

-- ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE meeting_candidates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scheduling_analytics ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own meetings" ON meetings
--     FOR SELECT USING (auth.uid() IN (
--         SELECT user_id FROM participant_availability 
--         WHERE meeting_id = meetings.id
--     ));

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert test data

-- INSERT INTO meetings (meeting_id, participant_count, required_participant_count, 
--     optional_participant_count, duration_minutes, earliest_date, latest_date, 
--     success, total_candidates_evaluated, candidates_returned, processing_time_ms)
-- VALUES ('test-meeting-001', 3, 2, 1, 60, 
--     '2026-02-10 00:00:00+00', '2026-02-14 23:59:59+00', 
--     true, 37, 10, 3.77);

-- =====================================================
-- GRANTS (For Supabase service role)
-- =====================================================
-- Supabase automatically handles most grants, but you can customize:

-- GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- =====================================================
-- COMMENTS (For documentation)
-- =====================================================
COMMENT ON TABLE meetings IS 'High-level meeting scheduling requests and results';
COMMENT ON TABLE meeting_candidates IS 'Ranked time slot candidates from AI Brain with detailed scores';
COMMENT ON TABLE score_breakdowns IS 'Detailed factor-level score breakdowns for explainability';
COMMENT ON TABLE scheduling_analytics IS 'Per-request analytics and metrics for insights';
COMMENT ON TABLE participant_availability IS 'Participant-level availability and preference summary';

COMMENT ON COLUMN meetings.meeting_id IS 'External identifier from client (must be unique)';
COMMENT ON COLUMN meetings.selected_candidate_id IS 'FK to chosen candidate after user selection';
COMMENT ON COLUMN meeting_candidates.rank IS '1-based ranking (1 = best candidate)';
COMMENT ON COLUMN meeting_candidates.conflict_participant_ids IS 'JSON array of user IDs with scheduling conflicts';
COMMENT ON COLUMN score_breakdowns.availability_details IS 'JSON: required_available, optional_available, ratios';
COMMENT ON COLUMN scheduling_analytics.conflict_rate IS 'Percentage of candidates with conflicts';
