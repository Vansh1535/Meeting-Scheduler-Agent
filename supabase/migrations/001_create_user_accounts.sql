-- Create user_accounts table for authentication
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    profile_picture_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    calendar_sync_enabled BOOLEAN NOT NULL DEFAULT true,
    google_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_google_id ON user_accounts(google_id);

-- Add trigger for updated_at (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON user_accounts;
    CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON user_accounts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE user_accounts IS 'User accounts with authentication credentials and profile information';
