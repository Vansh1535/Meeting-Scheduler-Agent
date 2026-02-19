# Check Specific Event - Corrected Query
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Checking 'Test Meeting from AI Scheduler'" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Corrected Query (with proper column names):" -ForegroundColor Green
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
WHERE ce.description ILIKE '%AI Meeting Scheduler%'
ORDER BY ce.start_time DESC;
"@ -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Quick Fix Option:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the event IS in meetings table but shows as 'google':" -ForegroundColor Yellow
Write-Host "  1. Click 'Sync Calendar' button in your app" -ForegroundColor White
Write-Host "  2. Refresh the page" -ForegroundColor White
Write-Host "  3. Event should now show as AI Platform (red)" -ForegroundColor White
Write-Host ""
Write-Host "If the event is NOT in meetings table:" -ForegroundColor Yellow
Write-Host "  → Manual update needed (run update query below)" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Manual Fix Query (if needed):" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host @"
-- This will mark ALL events with AI marker as ai_platform
UPDATE calendar_events
SET source_platform = 'ai_platform'
WHERE description ILIKE '%AI Meeting Scheduler%'
  AND source_platform = 'google';
"@ -ForegroundColor White
Write-Host ""
Write-Host "Run this ONLY if sync doesn't work" -ForegroundColor Red
Write-Host ""
