/*
 * Stage 5: Calendar Write-Back Migration
 * 
 * Adds tracking for Google Calendar event creation from AI scheduling decisions.
 * Enables idempotency, retry logic, and audit trails.
 */

-- Add write-back columns to meetings table
ALTER TABLE meetings
ADD COLUMN google_event_id TEXT,
ADD COLUMN google_calendar_id TEXT DEFAULT 'primary',
ADD COLUMN writeback_status TEXT CHECK (writeback_status IN ('pending', 'created', 'failed', 'retrying')) DEFAULT 'pending',
ADD COLUMN writeback_error TEXT,
ADD COLUMN writeback_attempted_at TIMESTAMPTZ,
ADD COLUMN writeback_succeeded_at TIMESTAMPTZ,
ADD COLUMN writeback_retry_count INTEGER DEFAULT 0,
ADD COLUMN google_event_link TEXT;

-- Create index for querying pending write-backs
CREATE INDEX idx_meetings_writeback_status ON meetings(writeback_status) WHERE writeback_status IN ('pending', 'retrying');

-- Create index for google_event_id lookups (idempotency checks)
CREATE INDEX idx_meetings_google_event_id ON meetings(google_event_id) WHERE google_event_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN meetings.google_event_id IS 'Google Calendar event ID after successful write-back';
COMMENT ON COLUMN meetings.google_calendar_id IS 'Target calendar ID (default: primary)';
COMMENT ON COLUMN meetings.writeback_status IS 'Status: pending (not yet attempted), created (success), failed (error), retrying (auto-retry)';
COMMENT ON COLUMN meetings.writeback_error IS 'Error message if write-back failed';
COMMENT ON COLUMN meetings.writeback_attempted_at IS 'Timestamp of last write-back attempt';
COMMENT ON COLUMN meetings.writeback_succeeded_at IS 'Timestamp of successful write-back';
COMMENT ON COLUMN meetings.writeback_retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN meetings.google_event_link IS 'Direct link to Google Calendar event';

-- Create view for write-back monitoring
CREATE OR REPLACE VIEW v_writeback_status AS
SELECT 
  m.meeting_id,
  m.created_at AS scheduled_at,
  m.writeback_status,
  m.writeback_attempted_at,
  m.writeback_succeeded_at,
  m.writeback_retry_count,
  m.google_event_id,
  m.google_event_link,
  m.writeback_error
FROM meetings m
WHERE m.writeback_status IS NOT NULL
ORDER BY m.created_at DESC;

COMMENT ON VIEW v_writeback_status IS 'Monitor calendar write-back status and metrics';

-- Create function to mark write-back as successful
CREATE OR REPLACE FUNCTION mark_writeback_success(
  p_meeting_id TEXT,
  p_google_event_id TEXT,
  p_google_calendar_id TEXT,
  p_google_event_link TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE meetings
  SET 
    google_event_id = p_google_event_id,
    google_calendar_id = p_google_calendar_id,
    google_event_link = p_google_event_link,
    writeback_status = 'created',
    writeback_succeeded_at = NOW(),
    writeback_error = NULL
  WHERE meeting_id = p_meeting_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_writeback_success IS 'Mark meeting write-back as successful and store Google event metadata';

-- Create function to mark write-back as failed
CREATE OR REPLACE FUNCTION mark_writeback_failure(
  p_meeting_id TEXT,
  p_error_message TEXT,
  p_should_retry BOOLEAN DEFAULT TRUE
) RETURNS VOID AS $$
BEGIN
  UPDATE meetings
  SET 
    writeback_status = CASE 
      WHEN p_should_retry AND writeback_retry_count < 3 THEN 'retrying'
      ELSE 'failed'
    END,
    writeback_error = p_error_message,
    writeback_attempted_at = NOW(),
    writeback_retry_count = writeback_retry_count + 1
  WHERE meeting_id = p_meeting_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_writeback_failure IS 'Mark meeting write-back as failed with error details and retry logic';

-- Create function to get pending write-backs
CREATE OR REPLACE FUNCTION get_pending_writebacks(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  meeting_id TEXT,
  writeback_retry_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.meeting_id,
    m.writeback_retry_count,
    m.created_at
  FROM meetings m
  WHERE m.writeback_status IN ('pending', 'retrying')
  ORDER BY 
    CASE WHEN m.writeback_status = 'pending' THEN 0 ELSE 1 END,
    m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_writebacks IS 'Get meetings awaiting calendar write-back (pending first, then retrying)';

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Stage 5 migration complete: Calendar write-back tracking added';
  RAISE NOTICE '- Added 8 columns to meetings table';
  RAISE NOTICE '- Created 2 indexes for performance';
  RAISE NOTICE '- Created 1 monitoring view';
  RAISE NOTICE '- Created 3 helper functions';
END $$;
