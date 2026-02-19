# Check Specific Event Detection
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Event Detection Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking for: 'Test Meeting from AI Scheduler'" -ForegroundColor Yellow
Write-Host ""

Write-Host "Query 1: Check in meetings table" -ForegroundColor Green
Write-Host @"
SELECT 
    meeting_id,
    status,
    google_event_id,
    writeback_status,
    created_at
FROM meetings
WHERE google_event_id IS NOT NULL
ORDER BY created_at DESC;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 2: Check in calendar_events table" -ForegroundColor Green
Write-Host @"
SELECT 
    id,
    title,
    google_event_id,
    source_platform,
    description,
    start_time,
    created_at
FROM calendar_events
WHERE title ILIKE '%Test Meeting%'
   OR description ILIKE '%AI Meeting Scheduler%'
ORDER BY created_at DESC
LIMIT 10;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 3: Check for match between tables" -ForegroundColor Green
Write-Host @"
SELECT 
    ce.title,
    ce.google_event_id,
    ce.source_platform as current_source,
    m.meeting_id,
    m.status as meeting_status,
    CASE 
        WHEN m.meeting_id IS NOT NULL THEN 'ai_platform'
        ELSE 'google'
    END as should_be
FROM calendar_events ce
LEFT JOIN meetings m ON ce.google_event_id = m.google_event_id
WHERE ce.title ILIKE '%Test Meeting%'
   OR ce.description ILIKE '%AI Meeting Scheduler%';
"@ -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "What to Look For:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If google_event_id is in BOTH tables:" -ForegroundColor Yellow
Write-Host "  → Event should be detected as AI Platform" -ForegroundColor White
Write-Host "  → If source_platform = 'google', sync didn't update it" -ForegroundColor White
Write-Host "  → Solution: Click 'Sync Calendar' button" -ForegroundColor White
Write-Host ""
Write-Host "If google_event_id is ONLY in calendar_events:" -ForegroundColor Yellow
Write-Host "  → Event was created before write-back tracking" -ForegroundColor White
Write-Host "  → No link between meetings and calendar_events" -ForegroundColor White
Write-Host "  → Solution: Manual update needed" -ForegroundColor White
Write-Host ""
Write-Host "If event not in meetings table at all:" -ForegroundColor Yellow
Write-Host "  → Event was created directly in Google Calendar" -ForegroundColor White
Write-Host "  → Or created before meetings table existed" -ForegroundColor White
Write-Host "  → Can't be auto-detected without manual intervention" -ForegroundColor White
Write-Host ""
