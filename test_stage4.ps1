# Stage 4 Testing Script
# Run after completing OAuth and calendar sync

param(
    [Parameter(Mandatory=$true)]
    [string]$UserId,
    
    [Parameter(Mandatory=$true)]
    [string]$UserEmail
)

Write-Host "🚀 Stage 4 Integration Testing Script" -ForegroundColor Green
Write-Host "User ID: $UserId" -ForegroundColor Cyan
Write-Host "Email: $UserEmail" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check OAuth Connection
Write-Host "Test 1: Verifying OAuth connection..." -ForegroundColor Yellow
$headers = @{
    "Content-Type" = "application/json"
}

# Test 2: Trigger Calendar Sync
Write-Host "Test 2: Syncing calendar..." -ForegroundColor Yellow
$syncBody = @{
    user_id = $UserId
    force_refresh = $true
} | ConvertTo-Json

try {
    $syncResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/calendar/sync" `
        -Method POST `
        -Headers $headers `
        -Body $syncBody `
        -UseBasicParsing
    
    $syncData = $syncResponse.Content | ConvertFrom-Json
    Write-Host "✅ Sync completed:" -ForegroundColor Green
    Write-Host "   Events fetched: $($syncData.events_fetched)" -ForegroundColor White
    Write-Host "   Events added: $($syncData.events_added)" -ForegroundColor White
    Write-Host "   Compression: $($syncData.compression_completed)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Sync failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Check Sync Status
Write-Host "Test 3: Checking sync status..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/calendar/sync?user_id=$UserId" `
        -Method GET `
        -UseBasicParsing
    
    $statusData = $statusResponse.Content | ConvertFrom-Json
    Write-Host "✅ Last sync:" -ForegroundColor Green
    Write-Host "   Status: $($statusData.last_sync.status)" -ForegroundColor White
    Write-Host "   Started: $($statusData.last_sync.started_at)" -ForegroundColor White
    Write-Host "   Duration: $($statusData.last_sync.total_duration_ms)ms" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Status check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Schedule Meeting with Real Data
Write-Host "Test 4: Scheduling meeting with real calendar data..." -ForegroundColor Yellow

$scheduleBody = @{
    meeting_id = "stage4-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    participant_emails = @($UserEmail)
    constraints = @{
        duration_minutes = 30
        earliest_date = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        latest_date = (Get-Date).AddDays(14).ToString("yyyy-MM-ddTHH:mm:ssZ")
        working_hours_start = 9
        working_hours_end = 17
        allowed_days = @("monday", "tuesday", "wednesday", "thursday", "friday")
        buffer_minutes = 15
        timezone = "America/New_York"
        max_candidates = 5
    }
} | ConvertTo-Json -Depth 10

try {
    $scheduleResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/schedule" `
        -Method POST `
        -Headers $headers `
        -Body $scheduleBody `
        -UseBasicParsing
    
    $scheduleData = $scheduleResponse.Content | ConvertFrom-Json
    Write-Host "✅ Meeting scheduled:" -ForegroundColor Green
    Write-Host "   Meeting ID: $($scheduleData.meeting_id)" -ForegroundColor White
    Write-Host "   Candidates found: $($scheduleData.candidates.Count)" -ForegroundColor White
    
    if ($scheduleData.candidates.Count -gt 0) {
        $topCandidate = $scheduleData.candidates[0]
        Write-Host "   Top candidate:" -ForegroundColor White
        Write-Host "     Time: $($topCandidate.slot.start)" -ForegroundColor Cyan
        Write-Host "     Score: $($topCandidate.score)" -ForegroundColor Cyan
        Write-Host "     Available: $($topCandidate.all_participants_available)" -ForegroundColor Cyan
    }
    Write-Host ""
} catch {
    Write-Host "❌ Scheduling failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "🎉 Testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Check Next.js logs for:" -ForegroundColor Yellow
Write-Host "  - '📧 Stage 4: Enriching X participants...'" -ForegroundColor White
Write-Host "  - '✅ Real calendars: X'" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify data in Supabase (calendar_events, compressed_calendars)" -ForegroundColor White
Write-Host "  2. Test with multiple participants" -ForegroundColor White
Write-Host "  3. Commit changes: git add . && git commit -m 'feat: Stage 4 complete'" -ForegroundColor White
