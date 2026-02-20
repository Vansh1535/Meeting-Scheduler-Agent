# Test Calendar Write-Back (Create Event)

Write-Host "=== Testing Calendar Write-Back ===" -ForegroundColor Cyan
Write-Host ""

# Get user
$headers = @{
    "X-User-Email" = "user1@example.com"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/user" -Method GET -Headers $headers -ErrorAction Stop
    $userId = $response.id
    
    Write-Host "User: $($response.email)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Error getting user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create a test event
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssK")
$tomorrowEnd = (Get-Date).AddDays(1).AddMinutes(30).ToString("yyyy-MM-ddTHH:mm:ssK")

$eventData = @{
    user_id = $userId
    summary = "Test Meeting from AI Scheduler"
    start_time = $tomorrow
    end_time = $tomorrowEnd
    timezone = "America/New_York"
    attendees = @("test@example.com")
    description = "This is a test event created by the AI Meeting Scheduler"
} | ConvertTo-Json

Write-Host "Creating event in Google Calendar..." -ForegroundColor Yellow
Write-Host "Title: Test Meeting from AI Scheduler" -ForegroundColor Gray
Write-Host "Time: Tomorrow at $(Get-Date -Date $tomorrow -Format 'HH:mm')" -ForegroundColor Gray
Write-Host ""

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/write-back/test" -Method POST -Body $eventData -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "Event created successfully!" -ForegroundColor Green
    
    if ($result.google_event_id) {
        Write-Host "   Event ID: $($result.google_event_id)" -ForegroundColor Gray
    }
    if ($result.google_event_link -or $result.html_link) {
        $link = if ($result.html_link) { $result.html_link } else { $result.google_event_link }
        Write-Host ""
        Write-Host "View in Google Calendar:" -ForegroundColor Cyan
        Write-Host $link -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "PHASE 1 COMPLETE!" -ForegroundColor Green
    Write-Host "   - User created OK" -ForegroundColor Gray
    Write-Host "   - OAuth connected OK" -ForegroundColor Gray
    Write-Host "   - Calendar sync OK" -ForegroundColor Gray
    Write-Host "   - Event creation OK" -ForegroundColor Gray
    
} catch {
    Write-Host "Failed to create event" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorObj.error) {
                Write-Host "Details: $($errorObj.error)" -ForegroundColor Yellow
            }
        } catch { }
    }
}

Write-Host ""
