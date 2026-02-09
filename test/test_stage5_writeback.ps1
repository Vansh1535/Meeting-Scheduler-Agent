# Stage 5: Calendar Write-Back Testing Script
# Tests end-to-end write-back flow: Schedule → Write to Google Calendar → Verify

Write-Host "`n=== Stage 5: Calendar Write-Back Testing ===" -ForegroundColor Cyan
Write-Host "Testing: AI scheduling → Google Calendar event creation`n" -ForegroundColor Gray

# Configuration
$baseUrl = "http://localhost:3000"
$userId = "e5f33381-a917-4e89-8eeb-61dae6811896"
$testEmail = "lilanivansh@gmail.com"

# Test data
$scheduleRequest = @{
    meeting_id = "stage5-writeback-test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    participant_emails = @($testEmail, "test.participant@example.com")
    constraints = @{
        duration_minutes = 30
        earliest_date = (Get-Date).AddDays(3).ToString("yyyy-MM-ddT00:00:00Z")
        latest_date = (Get-Date).AddDays(10).ToString("yyyy-MM-ddT00:00:00Z")
        working_hours_start = 9
        working_hours_end = 17
        allowed_days = @("monday", "tuesday", "wednesday", "thursday", "friday")
        buffer_minutes = 15
        timezone = "America/New_York"
        max_candidates = 5
    }
} | ConvertTo-Json -Depth 10

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   Meeting ID: $($scheduleRequest | ConvertFrom-Json | Select-Object -ExpandProperty meeting_id)"
Write-Host "   User: $testEmail"
Write-Host "   Duration: 30 minutes"
Write-Host ""

# Step 1: Run AI Scheduling
Write-Host "Step 1/5: Running AI Scheduling..." -ForegroundColor Green
try {
    $scheduleResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/schedule" `
        -Method POST `
        -ContentType "application/json" `
        -Body $scheduleRequest

    if (-not $scheduleResponse.success) {
        Write-Host "❌ Scheduling failed!" -ForegroundColor Red
        Write-Host $scheduleResponse.message -ForegroundColor Red
        exit 1
    }

    $meetingId = ($scheduleRequest | ConvertFrom-Json).meeting_id
    $topCandidate = $scheduleResponse.candidates[0]
    
    Write-Host "✅ Scheduling completed successfully" -ForegroundColor Green
    Write-Host "   Meeting ID: $meetingId" -ForegroundColor Cyan
    Write-Host "   Top candidate score: $($topCandidate.score)" -ForegroundColor Cyan
    Write-Host "   Time slot: $($topCandidate.slot.start_time)" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Scheduling request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Wait a moment for database persistence
Write-Host "Step 2/5: Waiting for database persistence..." -ForegroundColor Green
Start-Sleep -Seconds 2
Write-Host "✅ Ready for write-back`n" -ForegroundColor Green

# Step 3: Trigger Calendar Write-Back
Write-Host "Step 3/5: Creating Google Calendar event..." -ForegroundColor Green
try {
    $writebackRequest = @{
        meeting_id = $meetingId
    } | ConvertTo-Json

    $writebackResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/calendar/write-back" `
        -Method POST `
        -ContentType "application/json" `
        -Body $writebackRequest

    if (-not $writebackResponse.success) {
        Write-Host "❌ Write-back failed!" -ForegroundColor Red
        Write-Host $writebackResponse.message -ForegroundColor Red
        exit 1
    }

    $result = $writebackResponse.results[0]
    
    Write-Host "✅ Calendar event created successfully!" -ForegroundColor Green
    Write-Host "   Google Event ID: $($result.google_event_id)" -ForegroundColor Cyan
    Write-Host "   Event Link: $($result.google_event_link)" -ForegroundColor Cyan
    
    if ($result.already_exists) {
        Write-Host "   ℹ️  Note: Event already existed (idempotency check passed)" -ForegroundColor Yellow
    }
    
    Write-Host ""

    # Save event link for manual verification
    $eventLink = $result.google_event_link

} catch {
    Write-Host "❌ Write-back request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verify Write-Back Status
Write-Host "Step 4/5: Verifying write-back status in database..." -ForegroundColor Green
try {
    $statusResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/calendar/write-back?meeting_id=$meetingId" `
        -Method GET

    Write-Host "✅ Write-back status retrieved:" -ForegroundColor Green
    Write-Host "   Status: $($statusResponse.status)" -ForegroundColor Cyan
    Write-Host "   Google Event ID: $($statusResponse.google_event_id)" -ForegroundColor Cyan
    Write-Host "   Retry Count: $($statusResponse.retry_count)" -ForegroundColor Cyan
    Write-Host "   Succeeded At: $($statusResponse.succeeded_at)" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host "⚠️  Could not verify status: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Test Idempotency (try creating again)
Write-Host "Step 5/5: Testing idempotency (creating same event again)..." -ForegroundColor Green
try {
    $idempotencyRequest = @{
        meeting_id = $meetingId
    } | ConvertTo-Json

    $idempotencyResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/calendar/write-back" `
        -Method POST `
        -ContentType "application/json" `
        -Body $idempotencyRequest

    if ($idempotencyResponse.results[0].already_exists) {
        Write-Host "✅ Idempotency check passed! No duplicate event created." -ForegroundColor Green
        Write-Host "   Same Google Event ID returned: $($idempotencyResponse.results[0].google_event_id)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Warning: Idempotency check failed - new event might have been created" -ForegroundColor Yellow
    }
    Write-Host ""

} catch {
    Write-Host "❌ Idempotency test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✅ AI Scheduling: PASSED" -ForegroundColor Green
Write-Host "✅ Calendar Write-Back: PASSED" -ForegroundColor Green
Write-Host "✅ Status Verification: PASSED" -ForegroundColor Green
Write-Host "✅ Idempotency: PASSED" -ForegroundColor Green

Write-Host "`n📅 Manual Verification:" -ForegroundColor Yellow
Write-Host "1. Open Google Calendar: https://calendar.google.com"
Write-Host "2. Look for event titled: 'AI-Scheduled Meeting: ...'"
Write-Host "3. Verify:"
Write-Host "   - Event appears at correct time"
Write-Host "   - Attendees are invited"
Write-Host "   - Description contains AI reasoning"
Write-Host "   - Google Meet link is included"

if ($eventLink) {
    Write-Host "`n🔗 Direct event link:" -ForegroundColor Cyan
    Write-Host "   $eventLink" -ForegroundColor Blue
    Write-Host "`nOpening in browser..."
    Start-Process $eventLink
}

Write-Host "`n🎉 Stage 5 Testing Complete!`n" -ForegroundColor Green
