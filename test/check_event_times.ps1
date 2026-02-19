#!/usr/bin/env pwsh
# Check calendar event times

Write-Host "`n🔍 Checking Event Times...`n" -ForegroundColor Cyan

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"
$today = (Get-Date).ToString("yyyy-MM-dd")
$thirtyDaysLater = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")

Write-Host "Fetching calendar events from $today to $thirtyDaysLater..." -ForegroundColor Yellow

try {
    $params = @{
        Uri = "http://localhost:3000/api/calendar/events"
        Method = 'GET'
        Body = @{
            userId = $userId
            startDate = $today
            endDate = $thirtyDaysLater
        }
        ErrorAction = 'Stop'
    }
    
    $response = Invoke-RestMethod @params
    
    Write-Host "`nFound $($response.Count) events`n" -ForegroundColor Green
    
    if ($response.Count -gt 0) {
        foreach ($event in $response | Select-Object -First 5) {
            Write-Host "Event: $($event.title)" -ForegroundColor Cyan
            Write-Host "  Start Time: $($event.startTime)" -ForegroundColor White
            Write-Host "  End Time:   $($event.endTime)" -ForegroundColor White
            
            $start = [DateTime]::Parse($event.startTime)
            $end = [DateTime]::Parse($event.endTime)
            $duration = $end - $start
            
            $hours = [Math]::Round($duration.TotalHours, 2)
            $minutes = [Math]::Round($duration.TotalMinutes, 0)
            
            Write-Host "  Duration: $hours hours" -ForegroundColor Yellow
            
            if ($hours -eq 24 -or $hours -eq 23 -or $hours -eq 0) {
                Write-Host "  Type: ALL-DAY EVENT (this is the problem!)" -ForegroundColor Magenta
            } else {
                Write-Host "  Type: Timed event" -ForegroundColor Green
            }
            Write-Host ""
        }
    } else {
        Write-Host "No events found in the date range." -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

