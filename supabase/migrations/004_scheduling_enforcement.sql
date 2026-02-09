-- ============================================================================
-- Migration: 004_scheduling_enforcement
-- Stage 6: Scheduling Intelligence Enforcement
-- Purpose: Add enforcement tracking, risk scoring, and time-savings metrics
-- ============================================================================

-- Add enforcement tracking columns to meetings table
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS enforcement_status TEXT DEFAULT 'pending' CHECK (enforcement_status IN ('pending', 'passed', 'blocked', 'warning')),
ADD COLUMN IF NOT EXISTS enforcement_rules_applied JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS enforcement_blocks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cancellation_risk TEXT DEFAULT 'unknown' CHECK (cancellation_risk IN ('unknown', 'low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS cancellation_risk_factors JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS time_savings_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_savings_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS buffer_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_violations INTEGER DEFAULT 0;

-- Create enforcement_logs table for traceability
CREATE TABLE IF NOT EXISTS enforcement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('buffer_time', 'travel_time', 'cancellation_risk', 'time_savings', 'recurring_optimization')),
    rule_action TEXT NOT NULL CHECK (rule_action IN ('pass', 'block', 'warn', 'optimize')),
    rule_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    candidate_slot JSONB,
    enforced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create recurring_meeting_analysis table
CREATE TABLE IF NOT EXISTS recurring_meeting_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_pattern_id TEXT NOT NULL, -- e.g., "weekly-standup-mon-9am"
    participant_emails TEXT[] NOT NULL,
    current_slot JSONB NOT NULL, -- { day, time, duration }
    avg_score NUMERIC(5,2) NOT NULL,
    score_history JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ date, score }]
    suggested_slot JSONB, -- { day, time, duration, expected_score }
    optimization_reason TEXT,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_enforcement_status ON meetings(enforcement_status);
CREATE INDEX IF NOT EXISTS idx_meetings_cancellation_risk ON meetings(cancellation_risk);
CREATE INDEX IF NOT EXISTS idx_enforcement_logs_meeting_id ON enforcement_logs(meeting_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_logs_rule_type ON enforcement_logs(rule_type);
CREATE INDEX IF NOT EXISTS idx_enforcement_logs_enforced_at ON enforcement_logs(enforced_at DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_analysis_pattern ON recurring_meeting_analysis(meeting_pattern_id);
CREATE INDEX IF NOT EXISTS idx_recurring_analysis_status ON recurring_meeting_analysis(status);

-- ============================================================================
-- FUNCTION: log_enforcement_decision
-- Purpose: Log each enforcement decision for traceability
-- ============================================================================
CREATE OR REPLACE FUNCTION log_enforcement_decision(
    p_meeting_id TEXT,
    p_rule_type TEXT,
    p_rule_action TEXT,
    p_rule_details JSONB,
    p_candidate_slot JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO enforcement_logs (
        meeting_id,
        rule_type,
        rule_action,
        rule_details,
        candidate_slot
    ) VALUES (
        p_meeting_id,
        p_rule_type,
        p_rule_action,
        p_rule_details,
        p_candidate_slot
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: update_meeting_enforcement
-- Purpose: Update meeting with enforcement results
-- ============================================================================
CREATE OR REPLACE FUNCTION update_meeting_enforcement(
    p_meeting_id TEXT,
    p_enforcement_status TEXT,
    p_rules_applied JSONB,
    p_blocks JSONB,
    p_cancellation_risk TEXT DEFAULT 'unknown',
    p_risk_factors JSONB DEFAULT '{}'::jsonb,
    p_time_savings INTEGER DEFAULT 0,
    p_savings_metrics JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE meetings
    SET 
        enforcement_status = p_enforcement_status,
        enforcement_rules_applied = p_rules_applied,
        enforcement_blocks = p_blocks,
        cancellation_risk = p_cancellation_risk,
        cancellation_risk_factors = p_risk_factors,
        time_savings_minutes = p_time_savings,
        time_savings_metrics = p_savings_metrics,
        updated_at = NOW()
    WHERE meeting_id = p_meeting_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: record_recurring_analysis
-- Purpose: Store recurring meeting optimization suggestions
-- ============================================================================
CREATE OR REPLACE FUNCTION record_recurring_analysis(
    p_pattern_id TEXT,
    p_participant_emails TEXT[],
    p_current_slot JSONB,
    p_avg_score NUMERIC,
    p_score_history JSONB,
    p_suggested_slot JSONB DEFAULT NULL,
    p_optimization_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_analysis_id UUID;
BEGIN
    INSERT INTO recurring_meeting_analysis (
        meeting_pattern_id,
        participant_emails,
        current_slot,
        avg_score,
        score_history,
        suggested_slot,
        optimization_reason
    ) VALUES (
        p_pattern_id,
        p_participant_emails,
        p_current_slot,
        p_avg_score,
        p_score_history,
        p_suggested_slot,
        p_optimization_reason
    )
    RETURNING id INTO v_analysis_id;
    
    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: v_enforcement_summary
-- Purpose: Quick overview of enforcement decisions
-- ============================================================================
CREATE OR REPLACE VIEW v_enforcement_summary AS
SELECT 
    m.meeting_id,
    m.status AS meeting_status,
    m.enforcement_status,
    m.cancellation_risk,
    m.time_savings_minutes,
    m.buffer_violations,
    m.travel_violations,
    jsonb_array_length(COALESCE(m.enforcement_blocks, '[]'::jsonb)) AS total_blocks,
    m.created_at,
    m.updated_at
FROM meetings m
ORDER BY m.created_at DESC;

-- ============================================================================
-- VIEW: v_recurring_optimization_opportunities
-- Purpose: Identify recurring meetings that need optimization
-- ============================================================================
CREATE OR REPLACE VIEW v_recurring_optimization_opportunities AS
SELECT 
    r.meeting_pattern_id,
    r.participant_emails,
    r.current_slot,
    r.avg_score,
    r.suggested_slot,
    r.optimization_reason,
    r.status,
    r.analyzed_at
FROM recurring_meeting_analysis r
WHERE r.avg_score < 70 AND r.status = 'pending'
ORDER BY r.avg_score ASC, r.analyzed_at DESC;

-- ============================================================================
-- VIEW: v_time_savings_report
-- Purpose: Aggregate time savings across all meetings
-- ============================================================================
CREATE OR REPLACE VIEW v_time_savings_report AS
SELECT 
    COUNT(*) AS total_meetings,
    SUM(m.time_savings_minutes) AS total_minutes_saved,
    ROUND(AVG(m.time_savings_minutes), 2) AS avg_minutes_per_meeting,
    COUNT(*) FILTER (WHERE m.enforcement_status = 'blocked') AS meetings_blocked,
    COUNT(*) FILTER (WHERE m.buffer_violations > 0) AS buffer_violations_count,
    COUNT(*) FILTER (WHERE m.travel_violations > 0) AS travel_violations_count,
    COUNT(*) FILTER (WHERE m.cancellation_risk = 'high') AS high_risk_meetings
FROM meetings m
WHERE m.enforcement_status != 'pending';

-- Grant permissions (adjust as needed for your setup)
GRANT SELECT ON enforcement_logs TO anon, authenticated;
GRANT SELECT ON recurring_meeting_analysis TO anon, authenticated;
GRANT SELECT ON v_enforcement_summary TO anon, authenticated;
GRANT SELECT ON v_recurring_optimization_opportunities TO anon, authenticated;
GRANT SELECT ON v_time_savings_report TO anon, authenticated;

-- ============================================================================
-- Migration complete
-- Next steps:
-- 1. Run this migration in Supabase SQL editor
-- 2. Verify columns added: SELECT * FROM meetings LIMIT 1;
-- 3. Verify tables created: \dt enforcement_*
-- 4. Verify views: SELECT * FROM v_time_savings_report;
-- ============================================================================
