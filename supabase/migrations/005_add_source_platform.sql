-- Add source_platform column to calendar_events
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'google' CHECK (source_platform IN ('google', 'ai_platform'));

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_calendar_events_source_platform ON calendar_events(source_platform);

-- Add comment
COMMENT ON COLUMN calendar_events.source_platform IS 'Event source: google (native Google Calendar) or ai_platform (AI Meeting Scheduler)';

-- ==============================================
-- RETROACTIVE MARKING OF EXISTING AI EVENTS
-- ==============================================
-- This UPDATE statement marks ALL existing AI Platform events
-- that were created before this migration was applied.
-- 
-- It identifies AI events by checking if their google_event_id
-- exists in the meetings table (meaning they were created by our scheduler).

UPDATE calendar_events ce
SET source_platform = 'ai_platform'
FROM meetings m
WHERE ce.google_event_id = m.google_event_id
  AND m.google_event_id IS NOT NULL
  AND ce.source_platform = 'google';

-- ==============================================
-- VERIFICATION QUERY
-- ==============================================
-- Shows breakdown of events by source platform
-- Run this to verify the migration worked correctly

SELECT 
  source_platform,
  COUNT(*) as event_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM calendar_events
GROUP BY source_platform
ORDER BY event_count DESC;

-- ==============================================
-- DETAILED STATISTICS
-- ==============================================
-- Shows which users have how many AI Platform events

SELECT 
  u.email,
  COUNT(ce.id) as total_events,
  COUNT(ce.id) FILTER (WHERE ce.source_platform = 'ai_platform') as ai_events,
  COUNT(ce.id) FILTER (WHERE ce.source_platform = 'google') as google_events
FROM calendar_events ce
JOIN user_accounts u ON ce.user_id = u.id
GROUP BY u.email
ORDER BY ai_events DESC;
