# Check last created calendar events
Write-Host "Fetching last created events..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/calendar/events?userId=test-user-123" -UseBasicParsing -ErrorAction Stop
    $events = $response.Content | ConvertFrom-Json
    
    if ($events.Count -eq 0) {
        Write-Host "No events found in calendar" -ForegroundColor Red
        exit
    }
    
    Write-Host "Found $($events.Count) total events" -ForegroundColor Green
    Write-Host ""
    Write-Host "LAST 5 EVENTS CREATED:" -ForegroundColor Yellow
    Write-Host ("=" * 80)
    
    $sortedEvents = $events | Sort-Object { [DateTime]$_.startTime } -Descending | Select-Object -First 5
    
    foreach ($event in $sortedEvents) {
        $sourceColor = if ($event.source -eq 'ai') { 'Magenta' } else { 'Cyan' }
        Write-Host "Title: $($event.title)" -ForegroundColor White
        Write-Host "  Start: $($event.startTime)" -ForegroundColor Gray
        Write-Host "  Source: $($event.source)" -ForegroundColor $sourceColor
        Write-Host "  ID: $($event.id)" -ForegroundColor DarkGray
        Write-Host ""
    }
    
    # Count by source
    $aiEvents = @($events | Where-Object { $_.source -eq 'ai' }).Count
    $googleEvents = @($events | Where-Object { $_.source -eq 'google' }).Count
    
    Write-Host ("=" * 80)
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "  AI Events: $aiEvents" -ForegroundColor Magenta
    Write-Host "  Google Events: $googleEvents" -ForegroundColor Cyan
    
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the Next.js server is running on port 3000" -ForegroundColor Yellow
}
