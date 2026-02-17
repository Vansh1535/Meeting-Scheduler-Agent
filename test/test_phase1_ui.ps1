# Phase 1 UI Test Script
# Tests personalized navbar and real data display

Write-Host "=== Phase 1 UI Integration Test ===" -ForegroundColor Cyan
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"
$email = "42vanshlilani@gmail.com"
$baseUrl = "http://localhost:3000"

# Test 1: OAuth Status
Write-Host "[Test 1] Checking OAuth connection..." -ForegroundColor Yellow
try {
    $oauthResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/google/status/$userId" -Method GET
    if ($oauthResponse.connected) {
        Write-Host "[OK] OAuth connected: $($oauthResponse.email)" -ForegroundColor Green
        Write-Host "  Token expires: $($oauthResponse.expiresAt)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] OAuth not connected" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Failed to check OAuth status: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Calendar Events
Write-Host "[Test 2] Fetching calendar events..." -ForegroundColor Yellow
try {
    $eventsResponse = Invoke-RestMethod -Uri "$baseUrl/api/calendar/events?userId=$userId" -Method GET
    $eventCount = $eventsResponse.events.Count
    if ($eventCount -gt 0) {
        Write-Host "[OK] Found $eventCount event(s) in calendar" -ForegroundColor Green
        foreach ($event in $eventsResponse.events) {
            Write-Host "  - $($event.summary) at $($event.start)" -ForegroundColor Gray
        }
    } else {
        Write-Host "[WARN] No events found in calendar" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to fetch events: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=== Test Results Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing complete. Now check the UI manually:" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/dashboard in your browser" -ForegroundColor White
Write-Host "2. Press Ctrl+Shift+R to hard refresh and clear cache" -ForegroundColor White
Write-Host "3. Verify the top navbar shows your name and email" -ForegroundColor White
Write-Host "4. Check that stats show real data not fake numbers" -ForegroundColor White
Write-Host "5. Click Sync Calendar button to refresh your calendar data" -ForegroundColor White
Write-Host ""
Write-Host "Expected UI Changes:" -ForegroundColor Cyan
Write-Host "[OK] Top navbar with user avatar and name" -ForegroundColor Green
Write-Host "[OK] OAuth status indicator green checkmark if connected" -ForegroundColor Green
Write-Host "[OK] Personalized greeting with your first name" -ForegroundColor Green
Write-Host "[OK] Stats show real data or zeros not fake numbers" -ForegroundColor Green
Write-Host ""
