# Test which days are returned from AI scheduling
Write-Host "=== AI SCHEDULING DAYS TEST ===" -ForegroundColor Cyan
Write-Host ""

# Get user
$userResponse = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/user" `
    -Headers @{"X-User-Email" = "test@example.com"} `
    -UseBasicParsing
$userData = $userResponse.Content | ConvertFrom-Json
$userId = $userData.id

Write-Host "User ID: $userId" -ForegroundColor Green
Write-Host ""

# Create scheduling request
$startDate = (Get-Date).ToString("yyyy-MM-dd")
$endDate = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")

$scheduleRequest = @{
    meeting_id = "test-days-$(Get-Date -Format 'yyyyMMddHHmmss')"
    participant_emails = @("test@example.com")
    constraints = @{
        duration_minutes = 60
        earliest_date = "${startDate}T00:00:00Z"
        latest_date = "${endDate}T23:59:59Z"
        working_hours_start = 9
        working_hours_end = 17
        allowed_days = @("monday", "tuesday", "wednesday", "thursday", "friday")
        buffer_minutes = 15
        timezone = "UTC"
        max_candidates = 20
    }
    preferences = @{
        title = "Test Meeting"
    }
} | ConvertTo-Json -Depth 10

Write-Host "Sending scheduling request..." -ForegroundColor Yellow
Write-Host "Date range: $startDate to $endDate" -ForegroundColor Gray
Write-Host "Allowed days: monday, tuesday, wednesday, thursday, friday" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/schedule" `
        -Method POST `
        -ContentType "application/json" `
        -Body $scheduleRequest `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.candidates -and $result.candidates.Count -gt 0) {
        Write-Host "Found $($result.candidates.Count) candidates" -ForegroundColor Green
        Write-Host ""
        
        # Analyze which days appear
        $dayCount = @{}
        
        foreach ($candidate in $result.candidates) {
            $slotDate = [DateTime]::Parse($candidate.slot.start)
            $dayName = $slotDate.ToString("dddd")
            
            if (-not $dayCount.ContainsKey($dayName)) {
                $dayCount[$dayName] = 0
            }
            $dayCount[$dayName]++
        }
        
        Write-Host "=== DAY DISTRIBUTION ===" -ForegroundColor Cyan
        $allDays = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
        
        foreach ($day in $allDays) {
            $count = if ($dayCount.ContainsKey($day)) { $dayCount[$day] } else { 0 }
            $color = if ($count -gt 0) { "Green" } else { "Red" }
            Write-Host "$day : $count candidates" -ForegroundColor $color
        }
        
        Write-Host ""
        Write-Host "=== FIRST 5 CANDIDATES ===" -ForegroundColor Cyan
        $result.candidates | Select-Object -First 5 | ForEach-Object {
            $slotDate = [DateTime]::Parse($_.slot.start)
            Write-Host "$($slotDate.ToString('dddd, MMMM dd, yyyy HH:mm')) - Score: $($_.score)" -ForegroundColor White
        }
    }
    else {
        Write-Host "No candidates found!" -ForegroundColor Red
    }
}
catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
