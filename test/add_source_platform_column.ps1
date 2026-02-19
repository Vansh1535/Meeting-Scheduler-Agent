# Add source_platform column to calendar_events table
# Run this script to manually add the column using Supabase SQL Editor

Write-Host "`n=== Database Migration: Add source_platform Column ===" -ForegroundColor Cyan
Write-Host "Since psql is not available, please run this SQL in your Supabase SQL Editor:`n" -ForegroundColor Yellow

$sql = @"
-- Add source_platform column to calendar_events
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'google' CHECK (source_platform IN ('google', 'ai_platform'));

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_calendar_events_source_platform ON calendar_events(source_platform);

-- Add comment
COMMENT ON COLUMN calendar_events.source_platform IS 'Event source: google (native Google Calendar) or ai_platform (AI Meeting Scheduler)';

-- Update existing events that were created by AI Platform
-- (These will have a matching google_event_id in the meetings table)
UPDATE calendar_events ce
SET source_platform = 'ai_platform'
FROM meetings m
WHERE ce.google_event_id = m.google_event_id
  AND m.google_event_id IS NOT NULL
  AND ce.source_platform = 'google';

SELECT 
  COUNT(*) FILTER (WHERE source_platform = 'google') as google_events,
  COUNT(*) FILTER (WHERE source_platform = 'ai_platform') as ai_platform_events,
  COUNT(*) as total_events
FROM calendar_events;
"@

Write-Host $sql -ForegroundColor White

Write-Host "`n=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. Go to your Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Click 'SQL Editor' in the left sidebar" -ForegroundColor White
Write-Host "4. Click 'New Query'" -ForegroundColor White
Write-Host "5. Copy the SQL above and paste it into the editor" -ForegroundColor White
Write-Host "6. Click 'Run' to execute" -ForegroundColor White
Write-Host "7. The result will show how many events are from each platform`n" -ForegroundColor White

Write-Host "After running the SQL, restart your Next.js dev server for the changes to take effect.`n" -ForegroundColor Yellow

# Save SQL to file for easy reference
$sql | Out-File -FilePath "supabase/migrations/005_add_source_platform.sql" -Encoding UTF8 -Force

Write-Host "SQL has been saved to: supabase/migrations/005_add_source_platform.sql`n" -ForegroundColor Green
