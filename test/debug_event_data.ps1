#!/usr/bin/env pwsh
# Debug event data to see what's actually stored

Write-Host "`n🔍 Debugging Event Data...`n" -ForegroundColor Cyan

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"
$today = (Get-Date).AddDays(-5).ToString("yyyy-MM-dd")
$future = (Get-Date).AddDays(60).ToString("yyyy-MM-dd")

Write-Host "Fetching events..." -ForegroundColor Yellow

$params = @{
    Uri = "http://localhost:3000/api/calendar/events"
    Method = 'GET'
    Body = @{
        userId = $userId
        startDate = $today
        endDate = $future
    }
}

$response = Invoke-RestMethod @params

Write-Host "`nFound $($response.Count) events`n" -ForegroundColor Green

if ($response.Count -gt 0) {
    $response | Select-Object -First 3 | ForEach-Object {
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host "Title: $($_.title)" -ForegroundColor White
        Write-Host "Start Time RAW: $($_.startTime)" -ForegroundColor Yellow
        Write-Host "End Time RAW:   $($_.endTime)" -ForegroundColor Yellow
        Write-Host "Timezone: $($_.timezone)" -ForegroundColor Magenta
        
        $start = [DateTime]::Parse($_.startTime)
        $end = [DateTime]::Parse($_.endTime)
        
        Write-Host "`nParsed:" -ForegroundColor Green
        $startFormatted = $start.ToString('yyyy-MM-dd HH:mm:ss')
        $endFormatted = $end.ToString('yyyy-MM-dd HH:mm:ss')
        $duration = ($end - $start).TotalHours
        
        Write-Host "  Start: $startFormatted" -ForegroundColor White
        Write-Host "  End:   $endFormatted" -ForegroundColor White
        Write-Host "  Duration: $duration hours" -ForegroundColor White
        Write-Host ""
    }
}

