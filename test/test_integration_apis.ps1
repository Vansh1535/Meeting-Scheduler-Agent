# Test Integration Script
# Tests all the new API endpoints to verify the integration is working

$ProgressPreference = 'SilentlyContinue'
$baseUrls = @("http://localhost:3001", "http://localhost:3000")
$userId = "demo-user-123"

$baseUrl = $null
foreach ($url in $baseUrls) {
    try {
        $null = Invoke-WebRequest -Uri "$url/api/health" -Method Get -TimeoutSec 5 -UseBasicParsing
        $baseUrl = $url
        break
    } catch {
        if ($_.Exception.Message -notlike "*Unable to connect*") {
            $baseUrl = $url
            break
        }
    }
}

if (-not $baseUrl) {
    Write-Host "ERROR: No API base URL reachable on ports 3001 or 3000" -ForegroundColor Red
    exit 1
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Frontend-Orchestrator API" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Analytics
Write-Host "[1/8] Testing Analytics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/$userId?period=month" -Method Get
    Write-Host "Analytics API working" -ForegroundColor Green
    Write-Host "   - Total Events: $($response.totalEvents)" -ForegroundColor Gray
    Write-Host "   - Time Scheduled: $($response.timeScheduled)h" -ForegroundColor Gray
    Write-Host "   - Productivity: $($response.productivity)%" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Analytics API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Calendar Events
Write-Host "[2/8] Testing Calendar Events..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/calendar/events?userId=$userId" -Method Get
    Write-Host "Calendar Events API working" -ForegroundColor Green
    Write-Host "   - Events returned: $($response.count)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Calendar Events API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Preferences
Write-Host "[3/8] Testing Preferences..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/preferences/$userId" -Method Get
    Write-Host "Preferences API working" -ForegroundColor Green
    Write-Host "   - Timezone: $($response.preferences.timezone)" -ForegroundColor Gray
    Write-Host "   - Working Hours: $($response.preferences.workingHours.start) - $($response.preferences.workingHours.end)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Preferences API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Availability
Write-Host "[4/8] Testing Availability..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/availability/$userId?startDate=2026-02-14&endDate=2026-02-21" -Method Get
    Write-Host "Availability API working" -ForegroundColor Green
    Write-Host "   - Availability blocks: $($response.availability.Count)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Availability API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Time Saved
Write-Host "[5/8] Testing Time Saved Analytics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/$userId/time-saved" -Method Get
    Write-Host "Time Saved API working" -ForegroundColor Green
    Write-Host "   - Total hours saved: $($response.totalTimeSavedHours)h" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Time Saved API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Meeting Quality
Write-Host "[6/8] Testing Meeting Quality..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/$userId/meeting-quality" -Method Get
    Write-Host "Meeting Quality API working" -ForegroundColor Green
    Write-Host "   - Overall score: $($response.overallScore)/100" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Meeting Quality API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Productivity Insights
Write-Host "[7/8] Testing Productivity Insights..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/analytics/$userId/insights" -Method Get
    Write-Host "Productivity Insights API working" -ForegroundColor Green
    Write-Host "   - Insights generated: $($response.insights.Count)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Productivity Insights API failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Google Auth Status
Write-Host "[8/8] Testing Google Auth Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/google/status/$userId" -Method Get
    Write-Host "Google Auth Status API working" -ForegroundColor Green
    Write-Host "   - Connected: $($response.connected)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Google Auth Status API failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "All API endpoints tested!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Test Quick Schedule with POST request" -ForegroundColor Yellow
Write-Host "Run: ./test_quick_schedule.ps1" -ForegroundColor Gray
