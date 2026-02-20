# Track last event - Complete script
Write-Host "=== EVENT TRACKER ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure user exists
Write-Host "Step 1: Ensuring test user exists..." -ForegroundColor Yellow
try {
    $userResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/user" `
        -Headers @{"X-User-Email" = "test@example.com"} `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $userData = $userResponse.Content | ConvertFrom-Json
    $userId = $userData.id
    Write-Host "  User ID: $userId" -ForegroundColor Green
    Write-Host "  Email: $($userData.email)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "  Failed to get user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Check existing events
Write-Host "Step 2: Checking existing events..." -ForegroundColor Yellow
try {
    $eventsResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/calendar/events?userId=$userId" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $existingEvents = $eventsResponse.Content | ConvertFrom-Json
    Write-Host "  Found $($existingEvents.Count) existing events" -ForegroundColor Green
    
    if ($existingEvents.Count -gt 0) {
        Write-Host "  Last 3 events:" -ForegroundColor White
        $existingEvents | Sort-Object { [DateTime]$_.startTime } -Descending | Select-Object -First 3 | ForEach-Object {
            Write-Host "    - $($_.title) | $($_.startTime) | Source: $($_.source)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}
catch {
    Write-Host "  Failed to fetch events: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Create a new test event
Write-Host "Step 3: Creating new test event..." -ForegroundColor Yellow
$now = Get-Date
$tomorrow = $now.AddDays(1)
$eventDate = $tomorrow.ToString("yyyy-MM-dd")
$eventTime = "14:00"

$createBody = @{
    userId = $userId
    title = "Quick Schedule Test - $(Get-Date -Format 'HH:mm:ss')"
    description = "Auto-generated test event"
    duration = 30
    category = "meeting"
    preferredDate = $eventDate
    preferredTime = $eventTime
    priority = "medium"
    flexibility = "flexible"
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/schedule/quick" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $createResult = $createResponse.Content | ConvertFrom-Json
    
    if ($createResult.success) {
        Write-Host "  SUCCESS!" -ForegroundColor Green
        Write-Host "  Event ID: $($createResult.event.id)" -ForegroundColor White
        Write-Host "  Title: $($createResult.event.title)" -ForegroundColor White
        Write-Host "  Start: $($createResult.event.startTime)" -ForegroundColor White
        Write-Host "  Source: $($createResult.event.source)" -ForegroundColor Magenta
    }
    else {
        Write-Host "  Creation reported success=false" -ForegroundColor Red
    }
    Write-Host ""
}
catch {
    Write-Host "  FAILED!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Step 4: Verify event was created
Write-Host "Step 4: Verifying event in calendar..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

try {
    $verifyResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/calendar/events?userId=$userId" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $allEvents = $verifyResponse.Content | ConvertFrom-Json
    Write-Host "  Total events now: $($allEvents.Count)" -ForegroundColor Green
    
    if ($allEvents.Count -gt $existingEvents.Count) {
        Write-Host "  NEW EVENT CONFIRMED!" -ForegroundColor Green
        $newEvent = $allEvents | Sort-Object { [DateTime]$_.startTime } -Descending | Select-Object -First 1
        Write-Host ""
        Write-Host "=== LAST CREATED EVENT ===" -ForegroundColor Cyan
        Write-Host "Title:      $($newEvent.title)" -ForegroundColor White
        Write-Host "Start:      $($newEvent.startTime)" -ForegroundColor White
        Write-Host "End:        $($newEvent.endTime)" -ForegroundColor White
        Write-Host "Source:     $($newEvent.source)" -ForegroundColor $(if ($newEvent.source -eq 'ai') { 'Magenta' } else { 'Cyan' })
        Write-Host "Location:   $($newEvent.location)" -ForegroundColor Gray
        Write-Host "Event ID:   $($newEvent.id)" -ForegroundColor DarkGray
    }
    else {
        Write-Host "  WARNING: Event count did not increase!" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  Failed to verify: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TRACKING COMPLETE ===" -ForegroundColor Cyan
