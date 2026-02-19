# Verify Event Counts via Local API
# Cross-check what the Dashboard and Calendar are showing

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "EVENT COUNT VERIFICATION (via Local API)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Get user ID
$envPath = ".\frontend\.env.local"
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    if ($content -match 'NEXT_PUBLIC_USER_ID=([^\r\n]+)') {
        $userId = $matches[1]
    } else {
        $userId = "test-user"
    }
} else {
    $userId = "test-user"
}

Write-Host "User ID: $userId" -ForegroundColor Yellow
Write-Host ""

$baseUrl = "http://localhost:3000"

# 1. Calendar Events (February 2026)
Write-Host "1. CALENDAR EVENTS (from /api/calendar/events)" -ForegroundColor Green
Write-Host "   Period: Feb 1-28, 2026" -ForegroundColor Gray

try {
    $calUrl = "${baseUrl}/api/calendar/events?userId=${userId}&startDate=2026-02-01&endDate=2026-02-28"
    $calResponse = Invoke-RestMethod -Uri $calUrl -Method Get -ErrorAction Stop
    
    Write-Host "   Count: $($calResponse.Count)" -ForegroundColor Cyan
    
    if ($calResponse.Count -gt 0) {
        Write-Host ""
        Write-Host "   Events:" -ForegroundColor White
        $calResponse | Sort-Object start_time | ForEach-Object {
            $title = if ($_.title) { $_.title } else { $_.summary }
            $startDate = ([DateTime]$_.start_time).ToString("MMM dd @ HH:mm")
            Write-Host "   • $title" -ForegroundColor White
            Write-Host "     $startDate | Category: $($_.category)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   (Make sure Next.js dev server is running on port 3000)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 2. Analytics Data (Current Month)
Write-Host "2. ANALYTICS API (from /api/analytics)" -ForegroundColor Green
Write-Host "   Period: current_month" -ForegroundColor Gray

try {
    $analyticsUrl = "${baseUrl}/api/analytics/${userId}?period=current_month"
    $analyticsResponse = Invoke-RestMethod -Uri $analyticsUrl -Method Get -ErrorAction Stop
    
    Write-Host ""
    Write-Host "   Dashboard Stats (This Month):" -ForegroundColor White
    Write-Host "   • Total Events: $($analyticsResponse.totalEvents)" -ForegroundColor Cyan
    Write-Host "   • Time Scheduled: $($analyticsResponse.timeScheduled)h" -ForegroundColor White
    Write-Host "   • Completed: $($analyticsResponse.completedEvents)" -ForegroundColor White
    Write-Host "   • Productivity: $($analyticsResponse.productivity)%" -ForegroundColor White
    
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 3. Analytics Data (Last 30 Days for comparison)
Write-Host "3. ANALYTICS API - Last 30 Days" -ForegroundColor Green
Write-Host "   Period: month (rolling 30 days)" -ForegroundColor Gray

try {
    $analytics30Url = "${baseUrl}/api/analytics/${userId}?period=month"
    $analytics30Response = Invoke-RestMethod -Uri $analytics30Url -Method Get -ErrorAction Stop
    
    Write-Host ""
    Write-Host "   Analytics Page Stats (Last 30 Days):" -ForegroundColor White
    Write-Host "   • Total Events: $($analytics30Response.totalEvents)" -ForegroundColor Cyan
    Write-Host "   • Time Scheduled: $($analytics30Response.timeScheduled)h" -ForegroundColor White
    Write-Host "   • Completed: $($analytics30Response.completedEvents)" -ForegroundColor White
    Write-Host "   • Productivity: $($analytics30Response.productivity)%" -ForegroundColor White
    
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Green
Write-Host ""
Write-Host "Expected Counts:" -ForegroundColor White
Write-Host "  Dashboard 'Total Events': Should = Calendar Events + AI Meetings (status='scheduled')" -ForegroundColor Gray
Write-Host "  Calendar View: Should show same events from calendar_events table" -ForegroundColor Gray
Write-Host ""
Write-Host "If counts differ, the issue is likely:" -ForegroundColor Yellow
Write-Host "  • Dashboard counting pending/cancelled AI meetings" -ForegroundColor Gray
Write-Host "  • Dashboard including events outside current month" -ForegroundColor Gray
Write-Host "  • Calendar filtering differently than analytics API" -ForegroundColor Gray
Write-Host ""
