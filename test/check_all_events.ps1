# Check all events and users in database
Write-Host "Checking database status..." -ForegroundColor Cyan
Write-Host ""

# Check users
Write-Host "=== USERS ===" -ForegroundColor Yellow
try {
    $usersResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/debug/user-data/test-user-123" -UseBasicParsing -ErrorAction Stop
    $userData = $usersResponse.Content | ConvertFrom-Json
    Write-Host "User ID: $($userData.user.id)" -ForegroundColor Green
    Write-Host "User Email: $($userData.user.email)" -ForegroundColor Green
    Write-Host "Calendar Events Count: $($userData.calendar_events.count)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Could not fetch user data" -ForegroundColor Red
}

# Try to get events for the actual user
Write-Host "=== CHECKING DIFFERENT USER IDs ===" -ForegroundColor Yellow
$userIds = @("test-user-123", "user_123", "1")

foreach ($userId in $userIds) {
    Write-Host "Trying userId: $userId" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/calendar/events?userId=$userId" -UseBasicParsing -ErrorAction Stop
        $events = $response.Content | ConvertFrom-Json
        
        if ($events.Count -gt 0) {
            Write-Host "  FOUND $($events.Count) events!" -ForegroundColor Green
            $events | Select-Object -First 3 | ForEach-Object {
                Write-Host "    - $($_.title) ($($_.source))" -ForegroundColor White
            }
        }
        else {
            Write-Host "  No events" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
