# Final UI Verification Script

Write-Host "=== PHASE 1 - Final UI Verification ===" -ForegroundColor Green
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

# Wait for Next.js to start
Write-Host "Waiting for Next.js to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test 1: Check if frontend is running
Write-Host ""
Write-Host "Test 1: Frontend Status" -ForegroundColor Cyan
try {
    $frontendStatus = Invoke-RestMethod -Uri "http://localhost:3000" -Method GET -ErrorAction Stop -TimeoutSec 5
    Write-Host "  Frontend: ONLINE" -ForegroundColor Green
} catch {
    Write-Host "  Frontend: OFFLINE - Run: cd frontend; npm run dev" -ForegroundColor Red
    exit 1
}

# Test 2: Check backend
Write-Host ""
Write-Host "Test 2: Python AI Brain Status" -ForegroundColor Cyan
try {
    $backendStatus = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -ErrorAction Stop -TimeoutSec 5
    Write-Host "  Python Service: ONLINE" -ForegroundColor Green
} catch {
    Write-Host "  Python Service: OFFLINE - Run: cd python-service; python main.py" -ForegroundColor Red
}

# Test 3: Check OAuth
Write-Host ""
Write-Host "Test 3: OAuth Connection" -ForegroundColor Cyan
try {
    $oauthStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/status/$userId" -Method GET -ErrorAction Stop
    if ($oauthStatus.connected) {
        Write-Host "  OAuth: CONNECTED" -ForegroundColor Green
    } else {
        Write-Host "  OAuth: NOT CONNECTED - Run: .\oauth_setup.ps1" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  OAuth: ERROR" -ForegroundColor Red
}

# Test 4: Check calendar events
Write-Host ""
Write-Host "Test 4: Calendar Events" -ForegroundColor Cyan
$today = (Get-Date).ToString("yyyy-MM-dd")
$future = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
try {
    $events = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId&startDate=$today&endDate=$future" -Method GET -ErrorAction Stop
    
    if ($events.Length -gt 0) {
        Write-Host "  Events in Database: $($events.Length)" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Recent events:" -ForegroundColor White
        $events | Select-Object -First 5 | ForEach-Object {
            $date = Get-Date $_.startTime -Format "MMM dd, HH:mm"
            Write-Host "    - $($_.title) @ $date" -ForegroundColor Gray
        }
    } else {
        Write-Host "  Events in Database: 0" -ForegroundColor Yellow
        Write-Host "  No events found. Create one with: .\test_write_back.ps1" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Events API: ERROR" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=== UI Access ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open these pages in your browser:" -ForegroundColor White
Write-Host "  Dashboard: http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "  Calendar:  http://localhost:3000/calendar" -ForegroundColor Cyan
Write-Host "  Analytics: http://localhost:3000/analytics" -ForegroundColor Cyan
Write-Host ""

if ($events.Length -gt 0) {
    Write-Host "IMPORTANT: Hard refresh your browser to see the events!" -ForegroundColor Yellow
    Write-Host "  Windows:  Ctrl + Shift + R  or  Ctrl + F5" -ForegroundColor Gray
    Write-Host "  Mac:      Cmd + Shift + R" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your event should now appear in the UI!" -ForegroundColor Green
} else {
    Write-Host "Create a test event with: .\test_write_back.ps1" -ForegroundColor Yellow
}

Write-Host ""
