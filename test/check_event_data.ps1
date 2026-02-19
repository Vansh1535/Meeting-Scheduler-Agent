# Quick script to check what event data exists
Write-Host "=== Checking Event Data ===" -ForegroundColor Cyan

# Test calendar events API
Write-Host "`n1. Fetching Google Calendar Events..." -ForegroundColor Yellow
try {
    $calendarResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events" -Method GET -Headers @{
        "Cookie" = "auth-token=your-token-here"
    } -ErrorAction Stop
    Write-Host "Calendar Events Count: $($calendarResponse.Count)" -ForegroundColor Green
    if ($calendarResponse.Count -gt 0) {
        $calendarResponse | Select-Object -First 3 | ConvertTo-Json -Depth 3
    } else {
        Write-Host "⚠️  No calendar events found - This explains empty cards!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error fetching calendar events: $($_.Exception.Message)" -ForegroundColor Red
}

# Test meetings API
Write-Host "`n2. Fetching AI Meetings..." -ForegroundColor Yellow
try {
    $meetingsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/meetings" -Method GET -ErrorAction Stop
    Write-Host "AI Meetings Count: $($meetingsResponse.Count)" -ForegroundColor Green
    if ($meetingsResponse.Count -gt 0) {
        $meetingsResponse | Select-Object -First 3 | ConvertTo-Json -Depth 3
    }
} catch {
    Write-Host "❌ Error fetching meetings: $($_.Exception.Message)" -ForegroundColor Red
}

# Test analytics API
Write-Host "`n3. Fetching Analytics/Stats..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/stats" -Method GET -ErrorAction Stop
    Write-Host "Stats Response:" -ForegroundColor Green
    $statsResponse | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Error fetching stats: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== DIAGNOSIS ===" -ForegroundColor Cyan
Write-Host "If calendar events = 0 but meetings > 0:" -ForegroundColor Yellow
Write-Host "  → Dashboard stats show meetings (14 events)" -ForegroundColor White
Write-Host "  → Dashboard cards show calendar events (empty)" -ForegroundColor White
Write-Host "  → Solution: Sync Google Calendar OR use meetings for cards" -ForegroundColor Green
