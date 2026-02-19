# Check Existing Meetings Status
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Checking Existing Meetings" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Run these queries in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Query 1: Count total meetings" -ForegroundColor Green
Write-Host @"
SELECT COUNT(*) as total_meetings FROM meetings;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 2: Sample of existing meetings" -ForegroundColor Green
Write-Host @"
SELECT 
    id,
    title,
    status,
    start_time,
    end_time,
    google_event_id,
    created_at,
    updated_at
FROM meetings
ORDER BY created_at DESC
LIMIT 10;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 3: Meetings by status" -ForegroundColor Green
Write-Host @"
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE google_event_id IS NOT NULL) as has_google_id,
    COUNT(*) FILTER (WHERE google_event_id IS NULL) as missing_google_id
FROM meetings
GROUP BY status
ORDER BY count DESC;
"@ -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "What This Tells Us:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If total_meetings = 0:" -ForegroundColor Yellow
Write-Host "  → No AI meetings have been created yet" -ForegroundColor White
Write-Host "  → This is expected if you haven't used Quick Schedule" -ForegroundColor White
Write-Host "  → Solution: Create a test meeting" -ForegroundColor White
Write-Host ""
Write-Host "If total_meetings > 0 but all have google_event_id = NULL:" -ForegroundColor Yellow
Write-Host "  → Meetings were created but not written to Google Calendar" -ForegroundColor White
Write-Host "  → Could indicate an issue with Google Calendar write-back" -ForegroundColor White
Write-Host "  → Solution: Test creating a new meeting and check for errors" -ForegroundColor White
Write-Host ""
Write-Host "If some meetings have google_event_id:" -ForegroundColor Yellow
Write-Host "  → Write-back is working!" -ForegroundColor White
Write-Host "  → Those events should be marked as AI Platform after sync" -ForegroundColor White
Write-Host "  → Solution: Sync your calendar" -ForegroundColor White
Write-Host ""
