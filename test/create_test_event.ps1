# Create a test event via quick schedule
Write-Host "Creating test event..." -ForegroundColor Cyan

$body = @{
    userId = "test-user-123"
    title = "Test Event Created by Script"
    description = "Testing quick schedule event creation"
    duration = 30
    category = "meeting"
    preferredDate = "2026-02-21"
    preferredTime = "14:00"
    priority = "medium"
    flexibility = "flexible"
} | ConvertTo-Json

Write-Host "Sending request to /api/schedule/quick..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/schedule/quick" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Event created:" -ForegroundColor White
    Write-Host "  Title: $($result.event.title)" -ForegroundColor Cyan
    Write-Host "  Start: $($result.event.startTime)" -ForegroundColor Cyan
    Write-Host "  End: $($result.event.endTime)" -ForegroundColor Cyan
    Write-Host "  Source: $($result.event.source)" -ForegroundColor Magenta
    Write-Host "  ID: $($result.event.id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Now checking calendar..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 1
    
    # Verify event exists
    $eventsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/calendar/events?userId=test-user-123" -UseBasicParsing
    $events = $eventsResponse.Content | ConvertFrom-Json
    
    Write-Host "Total events in calendar: $($events.Count)" -ForegroundColor Green
    
    if ($events.Count -gt 0) {
        Write-Host "Last event:" -ForegroundColor White
        $lastEvent = $events | Sort-Object { [DateTime]$_.startTime } -Descending | Select-Object -First 1
        Write-Host "  $($lastEvent.title) - $($lastEvent.startTime)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host ""
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
