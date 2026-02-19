# Check Meeting Status and Write-Back History
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Meeting Status Analysis" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Run these queries to understand your 28 meetings:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Query 1: Meetings by status" -ForegroundColor Green
Write-Host @"
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE selected_candidate_id IS NOT NULL) as has_candidate,
    COUNT(*) FILTER (WHERE google_event_id IS NULL) as missing_google_id
FROM meetings
GROUP BY status
ORDER BY count DESC;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 2: Sample of meetings that should have been written" -ForegroundColor Green
Write-Host @"
SELECT 
    meeting_id,
    status,
    selected_candidate_id IS NOT NULL as has_candidate,
    google_event_id,
    writeback_status,
    writeback_retry_count,
    writeback_attempted_at,
    writeback_succeeded_at,
    created_at
FROM meetings
WHERE selected_candidate_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 3: Write-back failure analysis" -ForegroundColor Green
Write-Host @"
SELECT 
    writeback_status,
    COUNT(*) as count,
    AVG(writeback_retry_count) as avg_retries
FROM meetings
WHERE selected_candidate_id IS NOT NULL
GROUP BY writeback_status
ORDER BY count DESC;
"@ -ForegroundColor White
Write-Host ""

Write-Host "Query 4: Recent meetings waiting for write-back" -ForegroundColor Green
Write-Host @"
SELECT 
    meeting_id,
    status,
    writeback_status,
    writeback_retry_count,
    writeback_error,
    writeback_attempted_at,
    created_at
FROM meetings
WHERE selected_candidate_id IS NOT NULL 
  AND google_event_id IS NULL
ORDER BY created_at DESC
LIMIT 5;
"@ -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "What to Look For:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Status Field:" -ForegroundColor Yellow
Write-Host "   - 'scheduled' = AI scheduling completed, ready for write-back" -ForegroundColor White
Write-Host "   - 'pending' = Still waiting for user to select a candidate" -ForegroundColor White
Write-Host "   - If status is 'scheduled' but no google_event_id → write-back never ran" -ForegroundColor White
Write-Host ""
Write-Host "2. Write-Back Status:" -ForegroundColor Yellow
Write-Host "   - 'pending' = Waiting to be written" -ForegroundColor White
Write-Host "   - 'retrying' = Currently being written (stuck?)" -ForegroundColor White
Write-Host "   - 'failed' = Write-back attempted but failed" -ForegroundColor White
Write-Host "   - 'created' = Should have google_event_id" -ForegroundColor White
Write-Host ""
Write-Host "3. Write-Back Error Field:" -ForegroundColor Yellow
Write-Host "   - Check for 'invalid_grant' (OAuth expired)" -ForegroundColor White
Write-Host "   - Check for '404' (calendar not found)" -ForegroundColor White
Write-Host "   - Check for 'insufficient permissions'" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Solutions Based on Results:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If meetings are in 'pending' status without selected_candidate_id:" -ForegroundColor Yellow
Write-Host "  → These are incomplete - user hasn't selected a time slot" -ForegroundColor White
Write-Host "  → Can't be written to Google Calendar yet" -ForegroundColor White
Write-Host "  → NOT a problem - expected behavior" -ForegroundColor White
Write-Host ""
Write-Host "If meetings have selected_candidate_id but writeback_status = 'pending':" -ForegroundColor Yellow
Write-Host "  → Write-back was never triggered" -ForegroundColor White
Write-Host "  → Solution: Run batch write-back script" -ForegroundColor White
Write-Host ""
Write-Host "If writeback_status = 'failed' with errors:" -ForegroundColor Yellow
Write-Host "  → Write-back was attempted but failed" -ForegroundColor White
Write-Host "  → Check last_writeback_error for details" -ForegroundColor White
Write-Host "  → May need to reconnect Google account" -ForegroundColor White
Write-Host ""
