-- =====================================================
-- Stage 1: User Preferences + Availability Storage
-- =====================================================

-- User preferences for UI and scheduling defaults
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_preferences_unique UNIQUE (user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- User availability (future: store detailed weekly patterns)
CREATE TABLE IF NOT EXISTS user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_availability_unique UNIQUE (user_id)
);

CREATE INDEX idx_user_availability_user_id ON user_availability(user_id);

-- Triggers to update updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_availability_updated_at
    BEFORE UPDATE ON user_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
