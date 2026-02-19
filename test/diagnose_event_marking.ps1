# Diagnostic script to understand why events weren't marked as AI Platform
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "AI Event Marking Diagnostic Tool" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help diagnose why calendar events weren't marked as AI Platform events." -ForegroundColor Yellow
Write-Host ""

# Step 1: Check meetings table
Write-Host "STEP 1: Checking meetings table..." -ForegroundColor Green
Write-Host ""
Write-Host "Query 1: Total meetings in the meetings table" -ForegroundColor Cyan
Write-Host "SQL: SELECT COUNT(*) as total_meetings FROM meetings;" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Query 2: Meetings with google_event_id" -ForegroundColor Cyan
Write-Host "SQL: SELECT COUNT(*) as meetings_with_google_id FROM meetings WHERE google_event_id IS NOT NULL;" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Query 3: Sample of meetings with google_event_id" -ForegroundColor Cyan
Write-Host @"
SQL: 
SELECT 
    id,
    title,
    google_event_id,
    start_time,
    end_time,
    created_at
FROM meetings 
WHERE google_event_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
"@ -ForegroundColor DarkGray
Write-Host ""

# Step 2: Check calendar_events table
Write-Host "STEP 2: Checking calendar_events table..." -ForegroundColor Green
Write-Host ""
Write-Host "Query 4: Total calendar events" -ForegroundColor Cyan
Write-Host "SQL: SELECT COUNT(*) as total_calendar_events FROM calendar_events;" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Query 5: Sample of calendar events" -ForegroundColor Cyan
Write-Host @"
SQL: 
SELECT 
    id,
    summary,
    google_event_id,
    start_time,
    end_time,
    source_platform,
    created_at
FROM calendar_events 
ORDER BY created_at DESC
LIMIT 10;
"@ -ForegroundColor DarkGray
Write-Host ""

# Step 3: Check for matching google_event_ids
Write-Host "STEP 3: Checking for matches..." -ForegroundColor Green
Write-Host ""
Write-Host "Query 6: Events that SHOULD be marked as AI Platform" -ForegroundColor Cyan
Write-Host @"
SQL: 
SELECT 
    ce.id,
    ce.summary,
    ce.google_event_id,
    ce.source_platform as current_source,
    m.title as meeting_title,
    m.id as meeting_id
FROM calendar_events ce
INNER JOIN meetings m ON ce.google_event_id = m.google_event_id
WHERE m.google_event_id IS NOT NULL
LIMIT 10;
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "Query 7: Count of potential matches" -ForegroundColor Cyan
Write-Host @"
SQL: 
SELECT COUNT(*) as should_be_ai_platform
FROM calendar_events ce
INNER JOIN meetings m ON ce.google_event_id = m.google_event_id
WHERE m.google_event_id IS NOT NULL;
"@ -ForegroundColor DarkGray
Write-Host ""

# Step 4: Check for common issues
Write-Host "STEP 4: Common Issues to Check..." -ForegroundColor Green
Write-Host ""
Write-Host "Query 8: Meetings without google_event_id (not synced to Google yet)" -ForegroundColor Cyan
Write-Host @"
SQL: 
SELECT 
    id,
    title,
    status,
    created_at
FROM meetings 
WHERE google_event_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
"@ -ForegroundColor DarkGray
Write-Host ""

Write-Host "Query 9: Check if google_event_id format matches" -ForegroundColor Cyan
Write-Host @"
SQL: 
SELECT 
    'meetings' as table_name,
    google_event_id,
    LENGTH(google_event_id) as id_length
FROM meetings 
WHERE google_event_id IS NOT NULL
LIMIT 5

UNION ALL

SELECT 
    'calendar_events' as table_name,
    google_event_id,
    LENGTH(google_event_id) as id_length
FROM calendar_events 
LIMIT 5;
"@ -ForegroundColor DarkGray
Write-Host ""

# Instructions
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy each SQL query above (one at a time)" -ForegroundColor Yellow
Write-Host "2. Run it in your Supabase SQL Editor" -ForegroundColor Yellow
Write-Host "3. Share the results" -ForegroundColor Yellow
Write-Host ""
Write-Host "Key Questions to Answer:" -ForegroundColor Green
Write-Host "  - How many meetings exist? (Query 1)" -ForegroundColor White
Write-Host "  - How many meetings have google_event_id? (Query 2)" -ForegroundColor White
Write-Host "  - How many calendar_events have matching google_event_id? (Query 7)" -ForegroundColor White
Write-Host ""
Write-Host "Expected Scenario:" -ForegroundColor Green
Write-Host "  If meetings.google_event_id = NULL for all meetings," -ForegroundColor White
Write-Host "  it means AI-scheduled events haven't been written back to Google Calendar yet." -ForegroundColor White
Write-Host ""
Write-Host "Solution if google_event_id is NULL:" -ForegroundColor Green
Write-Host "  1. Create an AI-scheduled meeting using the Quick Schedule feature" -ForegroundColor White
Write-Host "  2. Verify it gets written to Google Calendar" -ForegroundColor White
Write-Host "  3. Check that meetings.google_event_id is populated" -ForegroundColor White
Write-Host "  4. Sync your calendar" -ForegroundColor White
Write-Host "  5. Check that the event appears in calendar_events" -ForegroundColor White
Write-Host "  6. Re-run the migration or marking script" -ForegroundColor White
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Waiting for your query results..." -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
