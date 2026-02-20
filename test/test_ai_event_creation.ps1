# Test AI Event Creation Flow
Write-Host "=== AI EVENT CREATION TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get user
Write-Host "Step 1: Getting test user..." -ForegroundColor Yellow
try {
    $userResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/user" `
        -Headers @{"X-User-Email" = "test@example.com"} `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $userData = $userResponse.Content | ConvertFrom-Json
    $userId = $userData.id
    Write-Host "  User ID: $userId" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Check current event count
Write-Host "Step 2: Checking current events..." -ForegroundColor Yellow
$currentEventsResponse = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/calendar/events?userId=$userId" `
    -UseBasicParsing
$currentEvents = $currentEventsResponse.Content | ConvertFrom-Json
Write-Host "  Current events: $($currentEvents.Count)" -ForegroundColor Green
Write-Host ""

# Step 3: Create AI event directly
Write-Host "Step 3: Creating AI-analyzed event..." -ForegroundColor Yellow
$tomorrow = (Get-Date).AddDays(1)
$startTime = Get-Date -Year 2026 -Month 2 -Day 21 -Hour 15 -Minute 0 -Second 0
$endTime = $startTime.AddMinutes(60)

$createBody = @{
    userId = $userId
    title = "AI Scheduled Meeting - Test"
    description = "This meeting was scheduled using AI analysis (Score: 92.5/100)"
    startTime = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endTime = $endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    participantEmails = @("test@example.com", "colleague@example.com")
    aiScore = 92.5
    aiReasoning = "Excellent match; all participants available; strong preference alignment"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/calendar/create-ai-event" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "  SUCCESS!" -ForegroundColor Green
    Write-Host "  Event ID: $($result.event.id)" -ForegroundColor White
    Write-Host "  Title: $($result.event.title)" -ForegroundColor White
    Write-Host "  Start: $($result.event.startTime)" -ForegroundColor White
    Write-Host "  AI Score: $($result.event.aiScore)/100" -ForegroundColor Magenta
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
    exit 1
}

# Step 4: Verify in calendar
Write-Host "Step 4: Verifying event appears in calendar..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$verifyResponse = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/calendar/events?userId=$userId" `
    -UseBasicParsing
$allEvents = $verifyResponse.Content | ConvertFrom-Json

Write-Host "  Total events now: $($allEvents.Count)" -ForegroundColor Green

if ($allEvents.Count -gt $currentEvents.Count) {
    Write-Host "  NEW EVENT CONFIRMED IN CALENDAR!" -ForegroundColor Green
    
    $newEvent = $allEvents | Where-Object { $_.title -like "*AI Scheduled*" } | Select-Object -First 1
    if ($newEvent) {
        Write-Host ""
        Write-Host "=== AI EVENT DETAILS ===" -ForegroundColor Cyan
        Write-Host "Title:      $($newEvent.title)" -ForegroundColor White
        Write-Host "Start:      $($newEvent.startTime)" -ForegroundColor White
        Write-Host "End:        $($newEvent.endTime)" -ForegroundColor White
        Write-Host "Source:     $($newEvent.source)" -ForegroundColor Magenta
        Write-Host "Attendees:  $($newEvent.attendeeCount)" -ForegroundColor Gray
        Write-Host "Event ID:   $($newEvent.id)" -ForegroundColor DarkGray
    }
}
else {
    Write-Host "  WARNING: Event count did not increase!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "The AI event should now be visible in the calendar UI" -ForegroundColor Green
